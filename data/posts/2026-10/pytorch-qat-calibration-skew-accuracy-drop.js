window.onPostDataLoaded({
    "title": "PyTorch QAT: Fix Calibration Skew & Accuracy Drop",
    "slug": "pytorch-qat-calibration-skew-accuracy-drop",
    "language": "Python",
    "code": "QuantizationError",
    "tags": [
        "Python",
        "PyTorch",
        "Machine Learning",
        "Error Fix"
    ],
    "analysis": "<p>Quantization Aware Training (QAT) simulates INT8 precision during the forward and backward passes using fake-quantization modules. This closes the gap between training and edge deployment. However, teams frequently encounter significant accuracy degradation post-conversion.</p><p>This drop typically stems from calibration skew: activation observers continually track min/max statistics during late training epochs when learning rates have decayed, or Batch Normalization layers are not correctly fused prior to observer attachment. When fake-quantization observers fail to freeze before the final iterations, weight oscillates around the quantization step thresholds, destroying convergence.</p>",
    "root_cause": "Unfused BatchNorm layers during observer insertion and failure to freeze fake-quantization observers and Batch Normalization statistics during final fine-tuning epochs.",
    "bad_code": "import torch\nimport torch.ao.quantization as quantization\n\nclass Net(torch.nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.conv = torch.nn.Conv2d(3, 16, 3)\n        self.bn = torch.nn.BatchNorm2d(16)\n        self.relu = torch.nn.ReLU()\n\n    def forward(self, x):\n        return self.relu(self.bn(self.conv(x)))\n\nmodel = Net()\n# BUG: Observers inserted without module fusion; observers never disabled\nmodel.qconfig = quantization.get_default_qat_qconfig('fbgemm')\nprepared_model = quantization.prepare_qat(model)\n\n# Train loop without freezing observers or BN\nfor epoch in range(10):\n    # train steps...\n    pass\n\nquantized_model = quantization.convert(prepared_model)",
    "solution_desc": "Fuse Conv2d, BatchNorm2d, and ReLU modules prior to QAT preparation using `torch.ao.quantization.fuse_modules`. During late training epochs, call `apply(quantization.disable_observer)` and `apply(torch.nn.intrinsic.qat.freeze_bn_stats)` to stabilize scale and zero-point parameters before exporting.",
    "good_code": "import torch\nimport torch.ao.quantization as quantization\n\nclass Net(torch.nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.conv = torch.nn.Conv2d(3, 16, 3)\n        self.bn = torch.nn.BatchNorm2d(16)\n        self.relu = torch.nn.ReLU()\n\n    def forward(self, x):\n        return self.relu(self.bn(self.conv(x)))\n\nmodel = Net()\nmodel.train()\n# 1. Fuse modules before preparation\nfused_model = quantization.fuse_modules(model, [['conv', 'bn', 'relu']])\nfused_model.qconfig = quantization.get_default_qat_qconfig('fbgemm')\nprepared_model = quantization.prepare_qat(fused_model)\n\n# 2. Train with scheduled freezing\ntotal_epochs = 10\nfor epoch in range(total_epochs):\n    if epoch > 7:\n        # Freeze scale/zero-point observers and BN statistics\n        prepared_model.apply(quantization.disable_observer)\n        prepared_model.apply(torch.ao.nn.intrinsic.qat.freeze_bn_stats)\n    # Run forward/backward passes here...\n\nprepared_model.eval()\nquantized_model = quantization.convert(prepared_model)",
    "verification": "Evaluate top-1 validation accuracy of both `prepared_model` (eval mode) and `quantized_model`. The accuracy difference between fake-quantized and INT8 converted models should be under 0.5%.",
    "date": "2026-10-11",
    "id": 1791712090,
    "type": "error"
});