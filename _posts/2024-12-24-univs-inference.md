---
title: "UniVS推理复现踩坑"
date: 2024-12-24
tags: [计算所, 模型部署]
render_with_liquid: false
excerpt: "记录 UniVS 视频分割推理的复现过程，涵盖 CUDA 与依赖安装、模型权重准备以及可视化推理配置。"
---

有个项目需要按照提示词做视频分割，感觉这个效果不错，就拿来试试。

项目地址：[UniVS](https://github.com/MinghanLi/UniVS/)：https://github.com/MinghanLi/UniVS/

项目介绍：参见 [CVPR 2024 \| 视频分割大一统！UniVS：统一通用视频分割](https://zhuanlan.zhihu.com/p/684659743)，在这里不做具体介绍。

## 1. 部署（环境：Ubuntu 20.04）

### 1.1 检查cuda toolkit

使用`nvcc -V`检查是否安装cuda toolkit，项目中需要用Cuda编译mask2former的MSDeformAttn，没有root权限安装cuda推荐[这篇文章](https://blog.csdn.net/Dove_Dan/article/details/130667793)

### 1.2 安装

下面参照[官方安装教程](https://github.com/MinghanLi/UniVS/blob/main/INSTALL.md)中的 **Example conda environment setup** 部分

#### 1.2.1 conda 环境

创建conda环境、安装pytorch以及opencv：

```bash
conda create --name univs python=3.10 -y
conda activate univs
conda install pytorch==2.1.1 torchvision==0.16.1 torchaudio==2.1.1 pytorch-cuda=12.1 -c pytorch -c nvidia
pip install -U opencv-python
```

#### 1.2.2 detectron2 安装

该项目依赖于detetron2，首先安装detetron2

```bash
# under your working directory
git clone git@github.com:facebookresearch/detectron2.git
cd detectron2
pip install -e .

cd ..
git clone git@github.com:MinghanLi/UniVS.git
cd UniVS
pip install -r requirements.txt
# compile MSDeformAttn
cd mask2former/modeling/pixel_decoder/ops
sh make.sh

# install davis2017_evaluation
cd univs/evaluation/davis2017-evaluation
# Install it - Python 3.6 or higher required
python setup.py install
```

#### 1.2.3 UniVS 安装

```bash
# under your working directory
cd ..
git clone git@github.com:MinghanLi/UniVS.git
cd UniVS
pip install -r requirements.txt
```

此外，部分包没有在requirements中说明，需要安装下面几个包：

```bash
pip install kornia regex
pip install git+https://github.com/cocodataset/panopticapi.git
```

编译 MSDeformAttn，过程中可能会有一堆警告之类的可以不用管，最后输出成功就行：

```bash
# compile MSDeformAttn
cd mask2former/modeling/pixel_decoder/ops
sh make.sh
```

评估用的

```bash
# install davis2017_evaluation
cd univs/evaluation/davis2017-evaluation
# Install it - Python 3.6 or higher required
python setup.py install
```

#### 1.2.4 下载推理所需预训练权重

这里参考[官方说明文档](https://github.com/MinghanLi/UniVS/blob/main/README.md)以及[model zoo](https://github.com/MinghanLi/UniVS/blob/main/Model_zoo.md)说明。

在项目文件夹新建一个 `pretrained`文件夹用于存放预训练模型，不建议修改成别的路径，因为好多文件都是默认指向这个文件夹存放的。

 1. UniVS Stage3: Long Video-level Joint Training model
如果只是**用于推理**，直接下[model_zoo.md](https://github.com/MinghanLi/UniVS/blob/main/Model_zoo.md)中 **2. UniVS Models** 小节的 **Stage3: Long Video-level Joint Training** 模型即可，推荐下载表中Backbone为Swin-base的训练权重，demo用的是这个，需要修改的config少。官方只给出**google网盘**的连接：[univs_swinb_stage3_f7_wosquare_ema.pth](https://drive.google.com/file/d/19Y_icBnyOh5TC-BS7mJdoQn0lN80jTOv/view)下载好后创建文件夹`pretrained/univs_v2_cvpr/`并存放其中。

 2. Prepare CLIP Text Encoder & Category Embeddings
根据[model_zoo.md](https://github.com/MinghanLi/UniVS/blob/main/Model_zoo.md)中 **2. Prepare CLIP Text Encoder & Category Embeddings** 小节的说明，下载**google网盘**中的[combined_datasets_cls_emb_rn50x4.pth](https://drive.google.com/file/d/1Wmw6n_u7NB3lARjXp6oUe9VsGa332zi8/view)文件，下载后保存到`datasets/concept_emb/`中

 3. **其他需要下载的**这个官方没有说明，但是需要下载，与regionCLIP有关，仍然是**google网盘**[regionclip_pretrained-cc_rn50x4_only_lang_encoder.pth](https://drive.google.com/file/d/1jzjiZHRag63KSXZq3XpLXj5FFDRLL9ZX/view?usp=drive_link)，下载后后创建文件夹`pretrained/regionclip/regionclip/`并存放其中。

## 2. 推理自己的视频

参考[官方说明文档](https://github.com/MinghanLi/UniVS/blob/main/README.md) **Visualization Demo**小节**Visualization Demo for Custom Videos**部分，该项目支持对视频和视频帧图像的推理。

对于类别导向的视觉任务，将文件存放在`./datasets/custom_videos/raw/`中，**不要有其他的数据**，检查`tools/test_custom_videos/test_custom_videos.sh`中的设置并执行

```bash
source  tools/test_custom_videos/test_custom_videos.sh
```

对于文本引导的的任务，将文件存放在`./datasets/custom_videos/raw_text/`中，**不要有其他的数据**，检查并修改`tools/test_custom_videos/test_custom_videos_text.sh`中的设置与CUSTOM_VIDEOS_TEXT并执行

```bash
source  tools/test_custom_videos/test_custom_videos_text.sh
```
