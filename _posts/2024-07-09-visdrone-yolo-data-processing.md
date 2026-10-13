---
title: "VisDrone数据集处理：车辆提取、YOLO格式转化、训练数据裁剪"
date: 2024-07-09
tags: [计算所, 目标检测, 数据处理]
render_with_liquid: false
excerpt: "整理 VisDrone 数据集预处理流程，提供车辆类别提取、YOLO 标注格式转换及大尺寸图像裁剪的实现代码。"
---

## 概述

做无人机视角下目标检测项目，希望利用VisDrone做预训练模型。模型用的是Ultralytics他们家的YOLO系列。需要将原数据集转化为YOLO格式，幸运的是，在 [`../ultralytics/cfg/datasets/VisDrone.yaml`](https://github.com/ultralytics/ultralytics/blob/main/ultralytics/cfg/datasets/VisDrone.yaml) 中有相关代码可直接使用，也可以简要修改，如提取指定目标等；此外，VisDrone-DET的分辨率在2000x1500左右，直接resize不利于小目标的检测，需要进行裁剪。

## 功能函数

### 格式转化并提取其中的部分目标（以车辆目标为例）

#### 思路介绍

参考[ultralytics官方转化代码](https://github.com/ultralytics/ultralytics/blob/main/ultralytics/cfg/datasets/VisDrone.yaml)，需要注意的是，[VisDrone-DET论文](https://arxiv.org/pdf/2001.06303)中包括`ignored regions, pedestrian, people, bicycle, car, van, 
truck, tricycle, awning-tricycle, bus, motor`共11类，而ultralytics利用判断语句

```python
if row[4] == '0':  # VisDrone 'ignored regions' class 0
    continue
cls = int(row[5]) - 1
```

跳过了 ignore regions 标签，同理，在此处修改为，也可以跳过class 1行人和class 2人群的标注（吐槽，我一直不明白为什么要分成 pedestrian 和 people 两类），但同时后面的 cls 编码也要同步修改

```python
if row[4] == '0' or row[5] == '1' or row[5] == '2': # skip VisDrone class 0 'ignored regions' , class 1 'pedestrian' snd class 2 'people'
    continue
# cls = int(row[5]) - 1
cls = int(row[5]) - 3
```

#### 函数实现

```python
def visdrone2yolo(dir):
    from PIL import Image
    from tqdm import tqdm
    from pathlib import Path
    
    def convert_box(size, box):
        # Convert VisDrone box to YOLO xywh box
        dw = 1. / size[0]
        dh = 1. / size[1]
        return (box[0] + box[2] / 2) * dw, (box[1] + box[3] / 2) * dh, box[2] * dw, box[3] * dh

    labels_dir = os.path.join(dir, 'labels')
    
    os.makedirs(labels_dir, exist_ok=True)  # make labels directory
    
    anno_dir = os.path.join(dir, 'annotations')
    
    pbar = tqdm(Path(anno_dir).glob('*.txt'), 
                # desc=f'Converting {dir}'
                )
    
    for f in pbar:
        image_dir = os.path.join(dir, 'images', f.name)
        img_size = Image.open(Path(image_dir).with_suffix('.jpg')).size
        lines = []
        with open(f, 'r') as file:  # read annotation.txt
            for row in [x.split(',') for x in file.read().strip().splitlines()]:
                # if row[4] == '0': # VisDrone 'ignored regions' class 0
                if row[4] == '0' or row[5] == '1' or row[5] == '2': # skip VisDrone class 0 'ignored regions' , class 1 'pedestrian' snd class 2 'people'
                    continue
                # cls = int(row[5]) - 1
                cls = int(row[5]) - 3
                box = convert_box(img_size, tuple(map(int, row[:4])))
                lines.append(f"{cls} {' '.join(f'{x:.6f}' for x in box)}\n")
                
        with open(str(f).replace(os.sep + 'annotations' + os.sep, os.sep + 'labels' + os.sep), 'w') as fl:
            fl.writelines(lines)  # write label.txt
```

### 可视化检查

#### 思路介绍

用于可视化检查转换后的yolo格式后，框是否对应，debug用，也可以其他yolo格式数据可视化（写论文用）。

#### 函数实现

```python
def draw_yolo_boxes(img_dir, label_dir, class_names, output_dir=None):
    import cv2
    
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for label_file in os.listdir(label_dir):
        if not label_file.endswith('.txt'):
            continue
        
        img_file = os.path.join(img_dir, os.path.splitext(label_file)[0] + '.jpg')
        img = cv2.imread(img_file)
        if img is None:
            print(f"Image {img_file} not found.")
            continue
        
        height, width, _ = img.shape
        label_path = os.path.join(label_dir, label_file)
        
        with open(label_path, 'r') as f:
            for line in f.readlines():
                parts = line.strip().split()
                class_id = int(parts[0])
                x_center = float(parts[1])
                y_center = float(parts[2])
                bbox_width = float(parts[3])
                bbox_height = float(parts[4])

                # Convert YOLO format to OpenCV format
                x_min = int((x_center - bbox_width / 2) * width)
                y_min = int((y_center - bbox_height / 2) * height)
                x_max = int((x_center + bbox_width / 2) * width)
                y_max = int((y_center + bbox_height / 2) * height)

                # Draw rectangle
                cv2.rectangle(img, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)

                # Draw label
                if class_id < 0 or class_id >= len(class_names):
                    print(f"label:{label_file} class_id:{class_id} ERROR!")
                    continue
                
                label = f"{class_names[class_id]}"
                label_size, base_line = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                top = max(y_min, label_size[1])
                cv2.rectangle(img, (x_min, top - label_size[1]), (x_min + label_size[0], top + base_line), (255, 255, 255), cv2.FILLED)
                cv2.putText(img, label, (x_min, top), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)

        if output_dir:
            output_file = os.path.join(output_dir, os.path.basename(img_file))
            cv2.imwrite(output_file, img)
        else:
            cv2.imshow('Image', img)
            # 每张图展示时间
            cv2.waitKey(1000)
            cv2.destroyAllWindows()
```

### 图片切分

#### 思路介绍

读标签，根据裁剪的大小和重叠区域计算边界框的坐标，需要注意的是，如果边界框在裁剪区域外，则忽略该边界框。输出的文件名格式为`{原始文件名}_{x}_{y}`表示在原切割前图片从左上角作为第一张图片切割的坐标，如`image1_1_0`表示被裁剪后的左上角第二个区域。

#### 代码实现

```python
import os
import cv2
import math

def load_labels(label_path):
    with open(label_path, 'r') as file:
        lines = file.readlines()
    labels = []
    for line in lines:
        parts = line.strip().split()
        label = {
            'class': int(parts[0]),
            'x_center': float(parts[1]),
            'y_center': float(parts[2]),
            'width': float(parts[3]),
            'height': float(parts[4])
        }
        labels.append(label)
    return labels

def save_labels(label_path, labels):
    with open(label_path, 'w') as file:
        for label in labels:
            file.write(f"{label['class']} {label['x_center']} {label['y_center']} {label['width']} {label['height']}\n")

def crop_image_and_labels(image, labels, crop_x, crop_y, crop_w, crop_h):
    cropped_image = image[crop_y:crop_y+crop_h, crop_x:crop_x+crop_w]
    img_h, img_w = image.shape[:2]

    cropped_labels = []
    for label in labels:
        x_center = label['x_center'] * img_w
        y_center = label['y_center'] * img_h
        width = label['width'] * img_w
        height = label['height'] * img_h

        new_x_center = x_center - crop_x
        new_y_center = y_center - crop_y

        if 0 <= new_x_center <= crop_w and 0 <= new_y_center <= crop_h:
            new_x_center /= crop_w
            new_y_center /= crop_h
            new_width = width / crop_w
            new_height = height / crop_h

            cropped_labels.append({
                'class': label['class'],
                'x_center': new_x_center,
                'y_center': new_y_center,
                'width': new_width,
                'height': new_height
            })

    return cropped_image, cropped_labels

def process_dataset(image_dir, label_dir, output_image_dir, output_label_dir, crop_size, overlap):
    if not os.path.exists(output_image_dir):
        os.makedirs(output_image_dir)
    if not os.path.exists(output_label_dir):
        os.makedirs(output_label_dir)

    crop_w, crop_h = crop_size
    overlap_w, overlap_h = int(crop_w * overlap), int(crop_h * overlap)

    for image_filename in os.listdir(image_dir):
        if image_filename.endswith(('.jpg', '.jpeg', '.png')):
            image_path = os.path.join(image_dir, image_filename)
            label_path = os.path.join(label_dir, os.path.splitext(image_filename)[0] + '.txt')

            image = cv2.imread(image_path)
            labels = load_labels(label_path)
            img_h, img_w = image.shape[:2]

            x_steps = math.ceil((img_w - crop_w) / (crop_w - overlap_w)) + 1
            y_steps = math.ceil((img_h - crop_h) / (crop_h - overlap_h)) + 1

            for y in range(y_steps):
                for x in range(x_steps):
                    crop_x = x * (crop_w - overlap_w)
                    crop_y = y * (crop_h - overlap_h)
                    crop_x = min(crop_x, img_w - crop_w)
                    crop_y = min(crop_y, img_h - crop_h)

                    cropped_image, cropped_labels = crop_image_and_labels(image, labels, crop_x, crop_y, crop_w, crop_h)

                    output_image_filename = f"{os.path.splitext(image_filename)[0]}_{x}_{y}.jpg"
                    output_image_path = os.path.join(output_image_dir, output_image_filename)
                    output_label_filename = f"{os.path.splitext(image_filename)[0]}_{x}_{y}.txt"
                    output_label_path = os.path.join(output_label_dir, output_label_filename)

                    cv2.imwrite(output_image_path, cropped_image)
                    save_labels(output_label_path, cropped_labels)
```

### 代码执行

定义输入文件树

```bash
VisDrone-DET
├─ VisDrone2019-DET-dev
│  ├─ annotations
│  │  └─ *.txt
│  └─ images
│     └─  *.jpg
├─ VisDrone2019-DET-train
│  ├─ annotations
│  │  └─ *.txt
│  └─ images
│     └─ *.jpg
└─ VisDrone2019-DET-val
│  ├─ annotations
│  │  └─ *.txt
│  └─ images
│     └─ *.jpg
└─ VisDrone_Progress.py
```

**YOLO格式转化和可视化**执行代码VisDrone_Progress.py为：

```python
# def visdrone2yolo(dir):
#     ...
# def draw_yolo_boxes(img_dir, label_dir, class_names, 
#     ...          
# def get_file_names(directory):
#     ...
# def compare_directories(dir_a, dir_b):
#     ...
if __name__ == "__main__":
    # 搞不明白路径就直接绝对路径就行
    dir = '../VisDrone-DET'
    
    # 若前面保留 pedestrian 和 people
    # class_names = ['pedestrian', 'people', 'bicycle',
    #                'car', 'van', 'trunck', 
    #                'tricycle', 'awning-tricycle',
    #                'bus', 'motor']
    # 若不保留 pedestrian 和 people
    
    class_names = [ 'bicycle',
                   'car', 'van', 'trunck', 
                   'tricycle', 'awning-tricycle',
                   'bus', 'motor']    
    for d in 'VisDrone2019-DET-train', 'VisDrone2019-DET-val', 'VisDrone2019-DET-test-dev':
        # YOLO 格式转化
        visdrone2yolo(os.path.join(dir,d))
        
        # 标签可视化(仅检查时取消注释)
        # draw_yolo_boxes(os.path.join(dir, d, 'images'), os.path.join(dir, d, 'labels'), class_names)
```

转换后文件树如下，此时yolo格式标注被保存在labels文件夹下：

```bash
VisDrone-DET
├─ VisDrone2019-DET-dev
│  ├─ annotations
│  │  └─ *.txt
│  ├─ images
│  │  └─ *.jpg
│  └─ labels
│     └─ *.txt
├─ VisDrone2019-DET-train
│  ├─ annotations
│  │  └─ *.txt
│  ├─ images
│  │  └─ *.jpg
│  └─ labels
│     └─ *.txt
└─ VisDrone2019-DET-val
   ├─ annotations
   │  └─ *.txt
   ├─ images
   │  └─ *.jpg
   └─ labels
      └─ *.txt
```

**数据集裁剪**执行代码Split.py为：

```python
import os
import cv2
import math

# def load_labels(label_path):
# ...
# def save_labels(label_path, labels):
# ...
# def crop_image_and_labels(image, labels, crop_x, crop_y, crop_w, crop_h):
# ...
# def process_dataset(image_dir, label_dir, output_image_dir, output_label_dir, crop_size, overlap):
#     ...

if __name__ == "__main__":
    # 配置裁剪参数和路径
    crop_size = (720, 720)  # 裁剪区域的宽和高
    overlap = 0.2  # 裁剪区域之间的重叠百分比
    data_root = '../VisDrone-DETdataset/'
    for d in 'VisDrone2019-DET-train', 'VisDrone2019-DET-val', 'VisDrone2019-DET-test-dev':
        image_dir = os.path.join(data_root, d, 'images')
        label_dir = os.path.join(data_root, d, 'labels')
        output_images_dir = os.path.join(data_root, d, 'images_split')
        output_labels_dir = os.path.join(data_root, d, 'labels_split')
        process_dataset(image_dir, label_dir, output_image_dir, output_label_dir, crop_size, overlap)
        print('{d} split')
        # 标签可视化(仅检查时取消注释, 引入可视化函数)
        # draw_yolo_boxes(output_images_dir, output_labels_dir, class_names)      
```
