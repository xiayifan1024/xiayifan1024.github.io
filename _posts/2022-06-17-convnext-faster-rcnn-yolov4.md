---
title: "ConvNext做Backbone的Faster R-CNN和YOLOV4（结合博主Bubbliiing的TF2实现代码）"
date: 2022-06-17
tags: [空天院, 模型结构]
render_with_liquid: false
excerpt: "基于 TensorFlow 2 实现 ConvNeXt，并结合 Bubbliiing 的检测框架，将其作为 YOLOv4 和 Faster R-CNN 的骨干网络。"
---

## 参考

Bubbliiing：[睿智的目标检测45——TF2搭建Faster R-CNN目标检测平台](https://blog.csdn.net/weixin_44791964/article/details/108513563)

太阳花的小绿豆：[ConvNeXt网络详解](https://blog.csdn.net/qq_37541097/article/details/122556545)

立Sir:[【神经网络】(19) ConvNeXt 代码复现，网络解析，附Tensorflow完整代码](https://blog.csdn.net/dgvv4/article/details/123792313)

facebook：[A ConvNet for the 2020s](https://github.com/facebookresearch/ConvNeXt)

## ConvNext 结构

ConvNext 结构简单易懂，没有什么新颖的东西，新人可以看着结构图就能写。甚至连类都不用写。
下图为博主[太阳花的小绿豆](https://blog.csdn.net/qq_37541097/article/details/122556545)做的ConvNext-T( C = (96, 192, 384, 768), B = (3, 3, 9, 3))的结构图，但是我代码中用的ConvNext-B( C = (128, 256, 512, 1024), B = (3, 3, 27, 3))，甚至魔改ConvNext用的还是较多的

![模型结构](/assets/images/posts/convnext-faster-rcnn-yolov4/1044e640213a9babf6ad71e6000b5ca8.png)

## 代码

### YOLOV4

在修改[bubbliiing的YOLOv4](https://github.com/bubbliiiing/yolov4-tf2)的Backbone时，我去掉了最后的Global Avg Pooling、Layer Norm以及Linear部分。直接输出，如果需要多尺度，输出后三个Stage的结果。借鉴了[FaceBook团队源码](https://github.com/facebookresearch/ConvNeXt)以及[太阳花的小绿豆](https://github.com/WZMIAOMIAO/deep-learning-for-image-processing/blob/master/tensorflow_classification/ConvNeXt/model.py)动态的Dropout，实际影响不大。

```python
import tensorflow as tf
import numpy as np

from tensorflow.keras import backend as K
from tensorflow.keras import Model
from tensorflow.keras.initializers import Constant
from tensorflow.keras.layers import (Conv2D, LayerNormalization,DepthwiseConv2D,Activation,Dropout,Layer,add,Dense)
from tensorflow.keras.utils import get_custom_objects

KERNEL_INITIALIZER = {
    "class_name": "TruncatedNormal",
    "config": {
        "stddev": 0.2
    }
}

BIAS_INITIALIZER = "Zeros"


class Mish(Layer):
    def __init__(self, **kwargs):
        super(Mish, self).__init__(**kwargs)
        self.supports_masking = True

    def call(self, inputs):
        return inputs * K.tanh(K.softplus(inputs))

    def get_config(self):
        config = super(Mish, self).get_config()
        return config

    def compute_output_shape(self, input_shape):
        return input_shape


def stem(inputs, num_filters):
    x = Conv2D(num_filters,
               kernel_size = (4,4),
               strides = 4,
               padding ='same',
               kernel_initializer = KERNEL_INITIALIZER,
               bias_initializer = BIAS_INITIALIZER)(inputs)
    x = LayerNormalization(epsilon=1e-6)(x)

    return x

def DownSample(inputs,num_filters):
    x = LayerNormalization(epsilon=1e-6)(inputs)

    x = Conv2D(num_filters,
               kernel_size = (2,2),
               strides = 2,
               padding = 'same',
               kernel_initializer = KERNEL_INITIALIZER,
               bias_initializer = BIAS_INITIALIZER)(x)
    return x

def ConvNext_Block(inputs, dropout_rate=0.,layer_scale_init_value = 1e-6):
    num_filters = inputs.shape[-1]

    residual = inputs

    x = DepthwiseConv2D(7,
                        strides = 1,
                        padding = 'same',
                        depthwise_initializer = KERNEL_INITIALIZER,
                        bias_initializer = BIAS_INITIALIZER)(inputs)

    x = LayerNormalization(epsilon=1e-6)(x)

    x = Conv2D(4*num_filters, 
                kernel_size=(1,1),
                 strides=1, 
                 padding='same',
                 kernel_initializer=KERNEL_INITIALIZER,
                 bias_initializer=BIAS_INITIALIZER)(x)
    
    # 1x1卷积等价于拉直
    # x = Dense(4 * dim,kernel_initializer=KERNEL_INITIALIZER,bias_initializer=BIAS_INITIALIZER)
    
    x = Activation('gelu')(x)
   
    x = Conv2D(num_filters, 
                kernel_size=(1,1),
                 strides=1, 
                 padding='same',
                 kernel_initializer=KERNEL_INITIALIZER,
                 bias_initializer=BIAS_INITIALIZER)(x)
    # Layer Scale
    gamma = Layer().add_weight(shape=[num_filters],
                               initializer=Constant(layer_scale_init_value),
                               dtype = tf.float32,
                               trainable = True)    

    if gamma is not None:
        x = gamma*x
    
    if dropout_rate > 0:
        x = Dropout(rate = dropout_rate)(x)

    x = add([x, residual])

    return x

def Res_stage(x, num, num_filters, dropout_rate, downsample = True,  layer_scale_init_value = 1e-6):
    '''
    num: 每个stage执行的block数
    out_channel: 输出通道数
    downsample: 是否下采样
    dropout_rate: 数组,为了动态DropOut
    '''
    if downsample is not False:
        x = DownSample(x, num_filters)

    for i in range(num):
        x = ConvNext_Block(x, dropout_rate = dropout_rate[i], layer_scale_init_value = layer_scale_init_value)
    
    return x

def ConvNext_Body(inputs, 
                  depths = [3,3,27,3], 
                  num_filters = [128,256,512,1024],
                  drop_path_rate = 0.25): # ConvNext_Base
    
    x = stem(inputs, num_filters[0])    # 416,416,3 -> 104, 104, 128
    
    dp_rates = np.linspace(start = 0, stop=drop_path_rate, num=sum(depths))
    sum_depths =[sum(depths[:1]),sum(depths[:2]),sum(depths[:3]),sum(depths[:4])]

    stage1_dp_rate = dp_rates[0:sum_depths[0]]
    x = Res_stage(x, num = depths[0], dropout_rate=stage1_dp_rate, num_filters = num_filters[0], downsample = False) # 104,104,128 -> 104,104,128

    stage2_dp_rate = dp_rates[sum_depths[0]:sum_depths[1]]
    x = Res_stage(x, num = depths[1], dropout_rate=stage2_dp_rate, num_filters = num_filters[1], downsample = True) # 104,104,128 -> 52,52,256
    feat1 = x

    stage3_dp_rate = dp_rates[sum_depths[1]:sum_depths[2]]
    x = Res_stage(x, num = depths[2], dropout_rate=stage3_dp_rate, num_filters = num_filters[2], downsample = True) # 104,104,128 -> 52,52,256
    feat2 = x

    stage4_dp_rate = dp_rates[sum_depths[2]:sum_depths[3]]
    x = Res_stage(x, num = depths[3], dropout_rate=stage4_dp_rate, num_filters = num_filters[3], downsample = True) # 52,52,256 -> 26,26,1024
    feat3 = x

    return feat1, feat2, feat3 # 输出多尺度
```

在文件`./nets/yolo.py`中，修改函数`yolo_body`即可

```python
	# feat1,feat2,feat3 = darknet_body(inputs, weight_decay=weight_decay)
	feat1,feat2,feat3 = ConvNext_Body(inputs)
```

### Faster R-CNN

在修改[bubbliiing的Faster R-CNN](https://github.com/bubbliiiing/faster-rcnn-tf2)的Backbone时，仿照他对Vgg16和ResNet50的处理方法。将前三个Stage提取特征图，最后一个Stage作为分类层。

```python
from pyexpat import model
from unicodedata import name
import tensorflow as tf
import numpy as np

from tensorflow.keras import backend as K
from tensorflow.keras import Model
from tensorflow.keras.initializers import Constant
from tensorflow.keras.layers import (Conv2D, LayerNormalization,DepthwiseConv2D,Activation,Dropout,Layer,add,Dense,
                                    TimeDistributed,GlobalAveragePooling2D)



KERNEL_INITIALIZER = {
    "class_name": "TruncatedNormal",
    "config": {
        "stddev": 0.2
    }
}

BIAS_INITIALIZER = "Zeros"


def stem(inputs, num_filters):
    x = Conv2D(num_filters,
               kernel_size = (4,4),
               strides = 4,
               padding ='same',
               kernel_initializer = KERNEL_INITIALIZER,
               bias_initializer = BIAS_INITIALIZER)(inputs)
    x = LayerNormalization(epsilon=1e-6)(x)

    return x

def DownSample(inputs,num_filters):
    x = LayerNormalization(epsilon=1e-6)(inputs)

    x = Conv2D(num_filters,
               kernel_size = (2,2),
               strides = 2,
               padding = 'same',
               kernel_initializer = KERNEL_INITIALIZER,
               bias_initializer = BIAS_INITIALIZER)(x)
    return x

def ConvNext_Block(inputs, dropout_rate=0.,layer_scale_init_value = 1e-6):
    num_filters = inputs.shape[-1]

    residual = inputs

    x = DepthwiseConv2D(7,
                        strides = 1,
                        padding = 'same',
                        depthwise_initializer = KERNEL_INITIALIZER,
                        bias_initializer = BIAS_INITIALIZER)(inputs)

    x = LayerNormalization(epsilon=1e-6)(x)

    x = Conv2D(4*num_filters, 
                kernel_size=(1,1),
                 strides=1, 
                 padding='same',
                 kernel_initializer=KERNEL_INITIALIZER,
                 bias_initializer=BIAS_INITIALIZER)(x)
    
    # 1x1卷积等价于拉直
    # x = Dense(4 * dim,kernel_initializer=KERNEL_INITIALIZER,bias_initializer=BIAS_INITIALIZER)
    
    x = Activation('gelu')(x)
    # x = Activation('Mish')(x)

    x = Conv2D(num_filters, 
                kernel_size=(1,1),
                 strides=1, 
                 padding='same',
                 kernel_initializer=KERNEL_INITIALIZER,
                 bias_initializer=BIAS_INITIALIZER)(x)
    # Layer Scale
    gamma = Layer().add_weight(shape=[num_filters],
                               initializer=Constant(layer_scale_init_value),
                               dtype = tf.float32,
                               trainable = True)    

    if gamma is not None:
        x = gamma*x
    
    if dropout_rate > 0:
        x = Dropout(rate = dropout_rate)(x)

    x = add([x, residual])

    return x

def Res_stage(x, num, num_filters, dropout_rate, downsample = True,  layer_scale_init_value = 1e-6):
    '''
    num: 每个stage执行的block数
    out_channel: 输出通道数
    downsample: 是否下采样
    dropout_rate: 数组,为了动态DropOut
    '''
    if downsample is not False:
        x = DownSample(x, num_filters)

    for i in range(num):
        x = ConvNext_Block(x, dropout_rate = dropout_rate[i], layer_scale_init_value = layer_scale_init_value)
    
    return x

#  记得把也改了convnext_classifier_layers
def ConvNext_Body(inputs, 
                  depths = [3,3,9,3], 
                  # depths = [2,4,4,2],
                  num_filters = [96,192,384,768],
                  drop_path_rate = 0.25): # ConvNext_Base
    
    x = stem(inputs, num_filters[0])    #
    
    dp_rates = np.linspace(start = 0, stop=drop_path_rate, num=sum(depths))
    sum_depths =[sum(depths[:1]),sum(depths[:2]),sum(depths[:3]),sum(depths[:4])]

    stage1_dp_rate = dp_rates[0:sum_depths[0]]
    x = Res_stage(x, num = depths[0], dropout_rate=stage1_dp_rate, num_filters = num_filters[0], downsample = False) # 

    stage2_dp_rate = dp_rates[sum_depths[0]:sum_depths[1]]
    x = Res_stage(x, num = depths[1], dropout_rate=stage2_dp_rate, num_filters = num_filters[1], downsample = True) # 
    # feat1 = x

    stage3_dp_rate = dp_rates[sum_depths[1]:sum_depths[2]]
    x = Res_stage(x, num = depths[2], dropout_rate=stage3_dp_rate, num_filters = num_filters[2], downsample = True) # 
    # feat2 = x

    # return feat1, feat2, feat3
    return x

    # model = Model(inputs, x)
    # return model

#--------------------------------------------------#
#                  分类部分                         #
#--------------------------------------------------#
def DownSample_td(inputs,num_filters):
    x = TimeDistributed(LayerNormalization(epsilon=1e-6))(inputs)

    x = TimeDistributed(Conv2D(num_filters,
               kernel_size = (2,2),
               strides = 2,
               padding = 'same',
               kernel_initializer = KERNEL_INITIALIZER,
               bias_initializer = BIAS_INITIALIZER))(x)
    return x

def ConvNext_Block_td(inputs, dropout_rate=0.,layer_scale_init_value = 1e-6):
    num_filters = inputs.shape[-1]

    residual = inputs

    x = TimeDistributed(DepthwiseConv2D(7,
                        strides = 1,
                        padding = 'same',
                        depthwise_initializer = KERNEL_INITIALIZER,
                        bias_initializer = BIAS_INITIALIZER))(inputs)

    x = TimeDistributed(LayerNormalization(epsilon=1e-6))(x)

    x = TimeDistributed(Conv2D(4*num_filters, 
                kernel_size=(1,1),
                 strides=1, 
                 padding='same',
                 kernel_initializer=KERNEL_INITIALIZER,
                 bias_initializer=BIAS_INITIALIZER))(x)
    
    # 1x1卷积等价于拉直
    # x = Dense(4 * dim,kernel_initializer=KERNEL_INITIALIZER,bias_initializer=BIAS_INITIALIZER)
    
    x = Activation('gelu')(x)
    # x = Activation('Mish')(x)

    x = TimeDistributed(Conv2D(num_filters, 
                kernel_size=(1,1),
                 strides=1, 
                 padding='same',
                 kernel_initializer=KERNEL_INITIALIZER,
                 bias_initializer=BIAS_INITIALIZER))(x)
    # Layer Scale
    gamma = Layer().add_weight(shape=[num_filters],
                               initializer=Constant(layer_scale_init_value),
                               dtype = tf.float32,
                               trainable = True)    

    if gamma is not None:
        x = gamma*x
    
    if dropout_rate > 0:
        x = TimeDistributed(Dropout(rate = dropout_rate))(x)

    x = add([x, residual])

    return x
def Res_stage_td(x, num, num_filters, dropout_rate, downsample = True,  layer_scale_init_value = 1e-6):
    '''
    num: 每个stage执行的block数
    out_channel: 输出通道数
    downsample: 是否下采样
    dropout_rate: 数组,为了动态DropOut
    '''
    if downsample is not False:
        x = DownSample_td(x, num_filters)

    for i in range(num):
        x = ConvNext_Block_td(x, dropout_rate = dropout_rate[i], layer_scale_init_value = layer_scale_init_value)
    
    return x

def convnext_classifier_layers(x, 
                  depths = [3,3,9,3], 
                  # depths = [2,4,4,2],
                  num_filters = [96,192,384,768],
                  drop_path_rate = 0.25):
    
    dp_rates = np.linspace(start = 0, stop=drop_path_rate, num=sum(depths))
    sum_depths =[sum(depths[:1]),sum(depths[:2]),sum(depths[:3]),sum(depths[:4])]

    stage3_dp_rate = dp_rates[sum_depths[2]:sum_depths[3]]
    x = Res_stage_td(x, num = depths[3], dropout_rate=stage3_dp_rate, num_filters = num_filters[3], downsample = True)

    x = TimeDistributed(GlobalAveragePooling2D(),name='avg_pool')(x)
    
    return x

# 查看网络时记得修改
if __name__ == "__main__":
    input_shape=[600,600,3]
    input = tf.keras.Input(input_shape,4)

    model = ConvNext_Body(input)

    model.summary()
```

在`./nets/frcnn.py`中加入convnext相关函数，如下（注意我把vgg，resnet和convnext放入了./nets/backbone文件夹下）

```python
from tensorflow.keras.layers import Input
from tensorflow.keras.models import Model

from nets.classifier import get_resnet50_classifier, get_vgg_classifier,get_convnext_classifier
from nets.rpn import get_rpn
from nets.backbones.resnet import ResNet50
from nets.backbones.vgg import VGG16
from nets.backbones.ConvNext import ConvNext_Body


def get_model(num_classes, backbone, num_anchors = 9, input_shape=[None, None, 3]):
    inputs      = Input(shape=input_shape)
    roi_input   = Input(shape=(None, 4))
    
    if backbone == 'vgg':
        #----------------------------------------------------#
        #   假设输入为600,600,3
        #   获得一个37,37,512的共享特征层base_layers
        #----------------------------------------------------#
        base_layers = VGG16(inputs)
        #----------------------------------------------------#
        #   将共享特征层传入建议框网络
        #   该网络结果会对先验框进行调整获得建议框
        #----------------------------------------------------#
        rpn         = get_rpn(base_layers, num_anchors)
        #----------------------------------------------------#
        #   将共享特征层和建议框传入classifier网络
        #   该网络结果会对建议框进行调整获得预测框
        #----------------------------------------------------#
        classifier  = get_vgg_classifier(base_layers, roi_input, 7, num_classes)

    if backbone == 'resnet50':
        #----------------------------------------------------#
        #   假设输入为600,600,3
        #   获得一个38,38,1024的共享特征层base_layers
        #----------------------------------------------------#
        base_layers = ResNet50(inputs)
        #----------------------------------------------------#
        #   将共享特征层传入建议框网络
        #   该网络结果会对先验框进行调整获得建议框
        #----------------------------------------------------#
        rpn         = get_rpn(base_layers, num_anchors)
        #----------------------------------------------------#
        #   将共享特征层和建议框传入classifier网络
        #   该网络结果会对建议框进行调整获得预测框
        #----------------------------------------------------#
        classifier  = get_resnet50_classifier(base_layers, roi_input, 14, num_classes)
    if backbone == 'convnext':
        #----------------------------------------------------#
        #   假设输入为600,600,3
        #   获得一个38,38,512的共享特征层base_layers
        #----------------------------------------------------#
        base_layers = ConvNext_Body(inputs)  
        #----------------------------------------------------#
        #   将共享特征层传入建议框网络
        #   该网络结果会对先验框进行调整获得建议框
        #----------------------------------------------------#
        rpn         = get_rpn(base_layers, num_anchors)
        #----------------------------------------------------#
        #   将共享特征层和建议框传入classifier网络
        #   该网络结果会对建议框进行调整获得预测框
        #----------------------------------------------------#
        classifier = get_convnext_classifier(base_layers, roi_input, 14, num_classes)
    model_rpn   = Model(inputs, rpn)
    model_all   = Model([inputs, roi_input], rpn + classifier)
    return model_rpn, model_all


def get_predict_model(num_classes, backbone, num_anchors = 9):
    inputs              = Input(shape=(None, None, 3))
    roi_input           = Input(shape=(None, 4))
    
    if backbone == 'vgg':
        feature_map_input = Input(shape=(None, None, 512))
        #----------------------------------------------------#
        #   假设输入为600,600,3
        #   获得一个37,37,512的共享特征层base_layers
        #----------------------------------------------------#
        base_layers = VGG16(inputs)
        #----------------------------------------------------#
        #   将共享特征层传入建议框网络
        #   该网络结果会对先验框进行调整获得建议框
        #----------------------------------------------------#
        rpn         = get_rpn(base_layers, num_anchors)
        #----------------------------------------------------#
        #   将共享特征层和建议框传入classifier网络
        #   该网络结果会对建议框进行调整获得预测框
        #----------------------------------------------------#
        classifier  = get_vgg_classifier(feature_map_input, roi_input, 7, num_classes)
    if backbone == 'resnet50':
        feature_map_input = Input(shape=(None, None, 1024))
        #----------------------------------------------------#
        #   假设输入为600,600,3
        #   获得一个38,38,1024的共享特征层base_layers
        #----------------------------------------------------#
        base_layers = ResNet50(inputs)
        #----------------------------------------------------#
        #   将共享特征层传入建议框网络
        #   该网络结果会对先验框进行调整获得建议框
        #----------------------------------------------------#
        rpn         = get_rpn(base_layers, num_anchors)
        #----------------------------------------------------#
        #   将共享特征层和建议框传入classifier网络
        #   该网络结果会对建议框进行调整获得预测框
        #----------------------------------------------------#
        classifier  = get_resnet50_classifier(feature_map_input, roi_input, 14, num_classes)
    if backbone == 'convnext':
        feature_map_input = Input(shape=(None, None, 512))
        #----------------------------------------------------#
        #   假设输入为600,600,3
        #   获得一个38,38,1024的共享特征层base_layers
        #----------------------------------------------------#
        base_layers = ConvNext_Body(inputs)
        #----------------------------------------------------#
        #   将共享特征层传入建议框网络
        #   该网络结果会对先验框进行调整获得建议框
        #----------------------------------------------------#
        rpn         = get_rpn(base_layers, num_anchors)

        #----------------------------------------------------#
        #   将共享特征层和建议框传入classifier网络
        #   该网络结果会对建议框进行调整获得预测框
        #----------------------------------------------------#
        classifier  = get_convnext_classifier(feature_map_input, roi_input, 14, num_classes)
        
    model_rpn   = Model(inputs, rpn + [base_layers])
    model_classifier_only = Model([feature_map_input, roi_input], classifier)
    return model_rpn, model_classifier_only
```
