---
title: "Yifan Xia | 夏一帆"
permalink: /
redirect_from:
  - /en/
  - /about/
  - /cv/
classes: [wide, resume-page]
locale: en
lang: en
translation_key: resume
description: "Personal résumé, education, experience and selected projects."
---

<div class="resume-header">
  <div class="resume-header-text">
    <h1>Yifan Xia | 夏一帆</h1>
    <p>Ph.D. Student in Electronic Information<br>Harbin Institute of Technology, Shenzhen</p>
    <p><a href="mailto:xiayifanol@126.com">Email</a> · <a href="https://github.com/xiayifan1024">GitHub</a></p>
  </div>
  <img class="resume-photo" src="{{ '/assets/images/profile.jpg' | relative_url }}" alt="Portrait of Yifan Xia" width="160">
</div>

## About Me

I am a Ph.D. student in Electronic Information at Harbin Institute of Technology, Shenzhen, advised by Prof. Miao Zhang. Previously, I worked as an engineer at the Key Laboratory of Intelligent Information Processing, Institute of Computing Technology, Chinese Academy of Sciences, focusing on visual recognition algorithms, model optimization, and deployment. I received my professional master's degree in Electronic Information from the University of Chinese Academy of Sciences, conducting research on synthetic aperture radar (SAR) object detection at the Aerospace Information Research Institute. I received my B.Eng. in Remote Sensing Science and Technology from China University of Mining and Technology, Beijing, with a minor in Computer Science and Technology.

My current interests center on **efficient video understanding with multimodal models, model compression, and on-device inference optimization**. In particular, I am exploring how to combine spatiotemporal changes in video with language semantics to retain relevant visual information under limited compute and memory budgets.

## Research Interests

- **Efficient Video Understanding and Visual Token Compression**: Exploring lightweight convolutional networks and spatiotemporal change cues for token selection before visual encoding, with the aim of reducing video redundancy and multimodal inference costs.
- **Language-Guided Spatiotemporal Selection**: Exploring question semantics, vision-language alignment, and local visual features to select evidence relevant to objects, actions, and temporal relationships.
- **Model Compression and Inference Acceleration**: Knowledge distillation, pruning, and quantization, alongside joint optimization of model architectures and inference pipelines to balance accuracy, latency, and memory use.
- **Edge AI and Algorithm-System Co-design**: Deployment of multimodal and small language models on resource-constrained devices, including context management, cache reuse, and inference scheduling for on-device agents.

## Education

<img class="education-logo" src="{{ '/assets/images/logos/HIT-logo.png' | relative_url }}" alt="" width="36" height="36"> **Harbin Institute of Technology, Shenzhen**<br>
Ph.D. Student in Electronic Information | Sep. 2026 - Present  
Advisor: Prof. Miao Zhang.

<img class="education-logo" src="{{ '/assets/images/logos/UCAS-logo.png' | relative_url }}" alt="" width="36" height="36"> **University of Chinese Academy of Sciences**<br>
Aerospace Information Research Institute, Chinese Academy of Sciences  
Professional Master's Degree in Electronic Information | Sep. 2020 - Jun. 2023  
Research focus: SAR object detection. Advisor: Prof. Fengjun Zhao.

<img class="education-logo" src="{{ '/assets/images/logos/CUMTB-logo.png' | relative_url }}" alt="" width="36" height="36"> **China University of Mining and Technology, Beijing**<br>
School of Geosciences and Surveying Engineering  
B.Eng. in Remote Sensing Science and Technology | Sep. 2017 - Jun. 2021  
Minor: Computer Science and Technology. Advisor: Prof. Debao Yuan.

## Experience

**Institute of Computing Technology, Chinese Academy of Sciences**  
Key Laboratory of Intelligent Information Processing  
Engineer | Jul. 2023 - Jul. 2026

Contributed to visual recognition research through the development and deployment of remote sensing recognition algorithms, model optimization, evaluation, and deployment on domestic computing platforms.

## Selected Publication

**Yifan Xia**, Fengjun Zhao, Yingjie Wang, and Chunle Wang.  
**[Aircraft Detection in SAR Images Based on Attention and Adaptive Feature Fusion](https://doi.org/10.20079/j.issn.1001-893x.221014002)**.  
*Telecommunication Engineering*, 2024. In Chinese.

This work investigates attention and adaptive feature fusion to address target scale variation and strong background scattering in SAR aircraft detection.

## Technical Experience

- **Visual Recognition**: Object detection, SAR image analysis, few-shot remote sensing object detection, and model evaluation.
- **Model Optimization**: Research and practical experience in pruning, knowledge distillation, quantization, and feature distillation across architectures.
- **Training and Deployment**: Model training on domestic accelerator cards, inference deployment on Fudan Microelectronics and Huawei development boards, and integration of training, inference, and evaluation workflows.
