---
title: "mmdetection以及mmrotate适配昇腾910ProB记录"
date: 2025-11-23
tags: [计算所, 目标检测, 模型部署]
render_with_liquid: false
excerpt: "记录在昇腾 910ProB 平台适配 MMDetection 和 MMRotate 的过程，涵盖驱动、CANN、PyTorch NPU 与 MMCV 安装及兼容性处理。"
---

## 一、昇腾训练卡物理安装

>教训：**910ProB** 和 **910B** 架构完全不同

### 1.在线服务器

目前在AutoDL上使用 “910B2x鲲鹏920” 1卡，暂不记录物理安装过程。

### 2. 离线服务器：Atlas 300T Pro (910ProB)

参考：[Atlas 300T Pro 训练卡 快速指南 (型号 9000)](https://support.huawei.com/enterprise/zh/doc/EDOC1100301103?idPath=23710424|251366513|22892968|252309113|256118195)

## 二、昇腾训练卡驱动安装

### 1.在线服务器

目前在AutoDL上有现成的`24.1rc1驱动版本 + CANN 8.0 版本`镜像。

### 2.离线服务器：Atlas 300T Pro (910ProB)

#### 2.1 固件与驱动安装

固件与驱动社区版网址：[固件与驱动](https://www.hiascend.com/hardware/firmware-drivers/community)
安装细节参考(**链接为25.2.0版本，具体按照自己需求选择**)：[Atlas 中心训练卡 25.2.0 NPU驱动和固件安装指南](https://support.huawei.com/enterprise/zh/doc/EDOC1100493512?idPath=23710424|251366513|22892968|252309113|256118195)

#### 2.2 CANN 安装

CANN、pytorch-npu扩展等其他资源下载地址：[资源下载中心](https://www.hiascend.com/developer/download/community)

##### 2.2.1 CANN 安装

下载 CANN Toolkit 和 Kernels 安装包
安装细节参考(**链接为8.3.RC1.alpha001，具体按照自己需求选择**): [CANN社区版](https://www.hiascend.com/document/detail/zh/CANNCommunityEdition/83RC1alpha001/index/index.html)

##### 2.2.2 pytorch-npu 安装

首先安装cpu版本pytorch，建议2.5版本以上，后续根据自己的CPU架构和pytorch版本选择对应的nou版本扩展包，具体安装细节参见[安装说明](https://www.hiascend.com/document/detail/zh/Pytorch/710/configandinstg/instg/insg_0001.html)

##### 2.2.3 Driving SDK 安装

旋转框目标检测会用得上的算子基本都在这个自动驾驶SDK里，（吐槽，我照着 mmcv 对CUDA实现的代码拿AI改了一堆算子）
DrivingSDK库：[Ascend/DrivingSDK](https://gitee.com/ascend/DrivingSDK)

![BoxIou在哪？](/assets/images/posts/mmdetection-mmrotate-ascend-910prob/9616cd8c1d99450a817856be0e74a214.png)

## 三、MMDetection v3.3.0安装、推理

### 1. MMEngine安装

```bash
pip install -U openmim
mim install mmengine
```

注意：通过后续的mmcv的安装过程来说，使用**MIM**直接安装mmengine可能存在不识别npu的风险，但目前由于没有直接调用mmengine，暂时按照这种方法安装。

### 2. MMCV安装

这里给出[昇腾方面的安装指南](https://www.hiascend.com/document/detail/zh/canncommercial/700/modeldevpt/ptmigr/AImpug_000123.html)和[MMCV方面的安装指南](https://mmcv-zh-cn.readthedocs.io/zh-cn/v2.0.1/get_started/build.html#npu-mmcv)，本人**方案二**有效。

#### 方案一：MIM安装MMCV（昇腾建议）

```bash
# if mmcv stack in 'Building wheel for mmcv(setup.py) ... /'
pip install psutil ninja
mim install mmcv==2.1.0
```

**注**：

- 如果MMCV卡在`Building wheel for mmcv(setup.py) ... /`，安装 **psutil** 和 **ninja**

- 有可能后续在执行demo.py时报错:`RuntimeError: nms_impl: implementation for device npu:0 not found.` 如果报错建议采用方案二。

### 方案二：源码编译安装（MMLab建议）

如果发生上述报错，建议通过源码编译安装，参考[mmcv-v2.0.1的readme](https://mmcv-zh-cn.readthedocs.io/zh-cn/v2.0.1/get_started/build.html#npu-mmcv)。

- 拉取MMCV源码

```bash
git pull https://github.com/open-mmlab/mmcv.git
cd mmcv
```

**注意**：该命令将直接拉取最新版本的MMCV源码，截止到记录时版本为2.2.0，超过mmdetection的推荐的`mmcv>=2.0.0rc4, <2.2.0`版本，这里有两种方法：一是拉取早起版本，这里不做详细介绍；二是修改MMDetection对于版本的判断条件，后续会在安装MMDetection部分介绍，也可以直接参照[昇腾文档](https://www.hiascend.com/document/detail/zh/Pytorch/700/comref/comaq/commonqa_0059.html)（编者注，由于MMDetection官方可能不再进行大版本更新，该方法可能随着MMCV后续的版本升级导致部分算子不支持）

- 编译

 ```bash
MMCV_WITH_OPS=1 MAX_JOBS=8 FORCE_NPU=1 python setup.py build_ext
```

- 安装

```bash
MMCV_WITH_OPS=1 FORCE_NPU=1 python setup.py develop
```

### 3. MMDetection安装、推理验证、简单训练

#### 3.1 源码安装

```bash
git clone https://github.com/open-mmlab/mmdetection.git
cd mmdetection
pip install -v -e .
```

**注**：

- 该方法拉取的是最新版的MMDetection v3.3.0，而下面的MMRotate要求mmdet\<3.0.0，不能直接使用，后面在MMRotate探索过程中会记录低版本的安装过程。

- 如果MMCV为2.2.0版本，将`./mmdet/__init__.py`中：

```python
    and mmcv_version < digit_version(mmcv_maximum_version)), \
```

修改为：

```python
    and mmcv_version <= digit_version(mmcv_maximum_version)), \
```

#### 3.2 推理验证

- 下载RTMDET的配置文件和checkpoint文件
在MMDetection文件夹内执行如下命令：

```bash
mim download mmdet --config rtmdet_tiny_8xb32-300e_coco --dest .
```

- 推理验证
在MMDetection文件夹内执行如下命令,结果会存放在`outputs`文件夹中。：

```bash
python demo/image_demo.py demo/demo.jpg rtmdet_tiny_8xb32-300e_coco.py --weights rtmdet_tiny_8xb32-300e_coco_20220902_112414-78e30dcc.pth --device npu
```

#### 3.3 训练验证

暂略

## 四 MMRotate 1.x安装与推理

### 1 安装与推理

编者在项目过程中后续要求使用MMRotate中的RTMDET-Rotate算法，而上述版本如果直接拉取MMRotate版本是会有不适应的问题，因而开展下面探索
**注意**：只是推理，训练需要添加Driving SDK或者根据缺失代码手动添加mmcv算子

- 拉取MMRotate 1.x源码，不要直接拉取MMRotate

```bash
git clone -b 1.x https://github.com/open-mmlab/mmrotate.git
```

- 修改`./requirements/mminstall.txt`内容

```txt
# mmcv>=2.0.0rc2,<2.1.0
mmcv>=2.0.0rc2
# mmdet>=3.0.0rc2,<3.1.0
mmdet>=3.0.0rc2
mmengine>= 0.1.0
```

- 推理验证

`./mmrotate/__init__.py`设置:

```python
mmcv_maximum_version = '2.2.0'
mmdet_maximum_version = '3.3.0'
```

保存后执行:

```bash
mim download mmrotate --config rotated_rtmdet_l-3x-dota --dest .
python demo/image_demo.py demo/demo.jpg rotated_rtmdet_l-3x-dota.py rotated_rtmdet_l-3x-dota-23992372.pth --device npu --out-file result.jpg
```

### 2 训练时可能涉及到的旋转框算子

#### 2.1 推荐但没测试：安装Driving SDK

略

#### 2.2 按需修改算子

##### 2.2.1 box_iou_rotated_npu

mmcv下找到`../mmcv/ops/csrc/pytorch/npu/box_iou_rotated_npu.cpp`，修改如下：

```cpp
#include "pytorch_npu_helper.hpp"

using namespace NPU_NAME_SPACE;
using namespace std;

void box_iou_rotated_impl(const Tensor boxes1, const Tensor boxes2, Tensor ious,
                          const int mode_flag, const bool aligned);

void box_iou_rotated_npu(const Tensor boxes1, const Tensor boxes2, Tensor ious,
                         const int mode_flag, const bool aligned) {
  // TORCH_CHECK(boxes1.size(1) == 5, "boxes1 must be 2D tensor (N, 5)");
  // TORCH_CHECK(boxes1.size(1) == 5, "boxes1 must be 2D tensor (N, 5)");
  // EXEC_NPU_CMD(aclnnBoxIou, boxes1, boxes2, mode_flag, aligned, ious);
  // return;
  at::Tensor boxes = at::ones_like(boxes1);
  at::Tensor query_boxes = at::ones_like(boxes2);
  boxes = boxes1.transpose(0, 1).unsqueeze(0);
  query_boxes = boxes2.transpose(0, 1).unsqueeze(0);

  bool is_trans = false;
  string modeStr = "iou";
  if (mode_flag == 1) {
    modeStr = "iof";
  }
  bool is_cross = true;
  if (aligned) {
    is_cross = false;
  }
  float v_threshold = 0;
  float e_threshold = 0;

  OpCommand cmd;
  cmd.Name("RotatedIou")
      .Input(boxes)
      .Input(query_boxes)
      .Output(ious)
      .Attr("trans", is_trans)
      .Attr("mode", modeStr)
      .Attr("is_cross", is_cross)
      .Attr("v_threshold", v_threshold)
      .Attr("e_threshold", e_threshold)
      .Run();

  if (is_cross) {
    ious = ious.view({boxes1.size(0), boxes2.size(0)});
  } else {
    ious = ious.view({boxes1.size(0), 1});
  }
}

REGISTER_NPU_IMPL(box_iou_rotated_impl, box_iou_rotated_npu);

```

##### 2.2.1 diff_iou_rotated_npu

mmcv下找到`../mmcv/ops/csrc/pytorch/npu/diff_iou_rotated_npu.cpp`，修改如下：

```cpp
#include "pytorch_npu_helper.hpp"
using namespace NPU_NAME_SPACE;
using namespace std;

// Tensor diff_iou_rotated_sort_vertices_npu(Tensor vertices, Tensor mask,
//                                           Tensor num_valid) {
//   TORCH_CHECK(vertices.dim() == 4,
//               "vertices must be a 4D Tensor, but got: ", vertices.dim());
//   TORCH_CHECK(mask.dim() == 3,
//               "mask must be a 3D Tensor, but got: ", mask.dim());
//   TORCH_CHECK(num_valid.dim() == 2,
//               "num_valid must be a 2D Tensor, but got: ", num_valid.dim());

//   uint32_t B = vertices.size(0);
//   uint32_t N = vertices.size(1);

//   at::Tensor sortedIdx = at::empty({B, N, 9}, num_valid.options());
//   at::Tensor mask_fp = mask.to(at::kFloat);

//   EXEC_NPU_CMD(aclnnDiffIouRotatedSortVertices, vertices, mask_fp, num_valid,
//                sortedIdx);

//   return sortedIdx;
// }

#define MAX_NUM_VERT_IDX 9
#define INTERSECTION_OFFSET 8
#define EPSILON 1e-8

// Compare normalized vertices (around (0,0))
// Returns true if vertex1 < vertex2 (ordered anti-clockwise)
inline bool compare_vertices(float x1, float y1, float x2, float y2) {
  if (fabs(x1 - x2) < EPSILON && fabs(y2 - y1) < EPSILON) {
    return false; // If equal, return false
  }

  if (y1 > 0 && y2 < 0) return true;
  if (y1 < 0 && y2 > 0) return false;

  float n1 = x1 * x1 + y1 * y1 + EPSILON;
  float n2 = x2 * x2 + y2 * y2 + EPSILON;
  float diff = fabs(x1) * x1 / n1 - fabs(x2) * x2 / n2;

  if (y1 > 0 && y2 > 0) {
    if (diff > EPSILON)
      return true;
    else
      return false;
  }
  if (y1 < 0 && y2 < 0) {
    if (diff < EPSILON)
      return true;
    else
      return false;
  }
  return false;
  
}

Tensor diff_iou_rotated_sort_vertices_npu(Tensor vertices, Tensor mask, Tensor num_valid) {
  // Input validation
  TORCH_CHECK(vertices.dim() == 4, "vertices must be a 4D Tensor, but got: ", vertices.dim());
  TORCH_CHECK(mask.dim() == 3, "mask must be a 3D Tensor, but got: ", mask.dim());
  TORCH_CHECK(num_valid.dim() == 2, "num_valid must be a 2D Tensor, but got: ", num_valid.dim());

  uint32_t B = vertices.size(0);
  uint32_t N = vertices.size(1);
  uint32_t M = vertices.size(2); // Should be 9 based on MAX_NUM_VERT_IDX

  // Create output tensor
  at::Device original_device = vertices.device();
  at::Tensor sortedIdx = at::empty({B, N, MAX_NUM_VERT_IDX}, num_valid.options());
  // at::Tensor mask_fp = mask.to(at::kFloat); // Convert mask to float for NPU compatibility
  vertices = vertices.cpu().to(at::kFloat).contiguous();
  mask = mask.cpu().to(at::kBool).contiguous();
  num_valid = num_valid.cpu().to(at::kInt).contiguous();
  sortedIdx = sortedIdx.cpu().to(at::kInt).contiguous();

  // Access tensor data on CPU for processing (assuming NPU allows CPU-side control)
  auto vertices_data = vertices.data_ptr<float>();
  auto mask_data = mask.data_ptr<bool>();
  auto num_valid_data = num_valid.data_ptr<int>();
  auto sortedIdx_data = sortedIdx.data_ptr<int>();
  
  for (uint32_t b = 0; b < B; ++b) {
    for (uint32_t i = 0; i < N; ++i) {
      // Find an invalid intersection point for padding
      int pad = 0;
      for (uint32_t j = INTERSECTION_OFFSET; j < M; ++j) {
        if (!mask_data[b * N * M + i * M + j]) {
          pad = j;
          break;
        }
      }

      int valid_count = num_valid_data[b * N + i];
      if (valid_count < 3) {
        // Not enough vertices, pad with invalid index
        for (uint32_t j = 0; j < MAX_NUM_VERT_IDX; ++j) {
          sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + j] = pad;
        }
      } else {
        // Sort valid vertices
        vector<pair<float, float>> valid_vertices;
        vector<int> indices;
        for (uint32_t k = 0; k < M; ++k) {
          if (mask_data[b * N * M + i * M + k]) {
            float x = vertices_data[b * N * M * 2 + i * M * 2 + k * 2 + 0];
            float y = vertices_data[b * N * M * 2 + i * M * 2 + k * 2 + 1];
            valid_vertices.emplace_back(x, y);
            indices.push_back(k);
          }
        }

        // Sort vertices using compare_vertices
        for (size_t j = 0; j < valid_vertices.size(); ++j) {
          for (size_t k = j + 1; k < valid_vertices.size(); ++k) {
            if (compare_vertices(valid_vertices[k].first, valid_vertices[k].second,
                                valid_vertices[j].first, valid_vertices[j].second)) {
              swap(valid_vertices[j], valid_vertices[k]);
              swap(indices[j], indices[k]);
            }
          }
        }

        // Write sorted indices
        for (size_t j = 0; j < valid_vertices.size(); ++j) {
          sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + j] = indices[j];
        }
        // Duplicate the first index
        if (valid_count > 0) {
          sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + valid_count] =
              sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + 0];
        }
        // Pad remaining with invalid index
        for (uint32_t j = valid_count + 1; j < MAX_NUM_VERT_IDX; ++j) {
          sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + j] = pad;
        }

        // Handle corner case: two boxes are exactly the same
        if (valid_count == 8) {
          int counter = 0;
          for (uint32_t j = 0; j < 4; ++j) {
            int check = sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + j];
            for (uint32_t k = 4; k < INTERSECTION_OFFSET; ++k) {
              if (sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + k] == check) {
                counter++;
              }
            }
          }
          if (counter == 4) {
            sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + 4] =
                sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + 0];
            for (uint32_t j = 5; j < MAX_NUM_VERT_IDX; ++j) {
              sortedIdx_data[b * N * MAX_NUM_VERT_IDX + i * MAX_NUM_VERT_IDX + j] = pad;
            }
          }
        }
      }
    }
  }

  // Move sortedIdx back to NPU
  sortedIdx = sortedIdx.to(original_device);

  // Optionally call NPU command if available
  // EXEC_NPU_CMD(aclnnDiffIouRotatedSortVertices, vertices, mask_fp, num_valid, sortedIdx);

  return sortedIdx;
}

Tensor diff_iou_rotated_sort_vertices_forward_impl(Tensor vertices, Tensor mask,
                                                   Tensor num_valid);

REGISTER_NPU_IMPL(diff_iou_rotated_sort_vertices_forward_impl,
                  diff_iou_rotated_sort_vertices_npu);

```
