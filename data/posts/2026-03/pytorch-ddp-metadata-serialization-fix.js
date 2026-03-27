window.onPostDataLoaded({
    "title": "Fixing Non-Deterministic Metadata in PyTorch DDP",
    "slug": "pytorch-ddp-metadata-serialization-fix",
    "language": "Python / PyTorch",
    "code": "RuntimeError",
    "tags": [
        "Machine Learning",
        "Distributed",
        "Python",
        "Error Fix"
    ],
    "analysis": "<p>PyTorch DistributedDataParallel (DDP) requires all participating processes (ranks) to have identical model graph structures and parameter metadata. A frequent source of 'Address already in use' or 'NCCL Checksum' errors is the non-deterministic serialization of metadata, often caused by iterating over standard Python dictionaries or sets when defining parameter groups or state dicts.</p><p>When ranks disagree on the order of parameters, the collective communication calls (like AllReduce) map gradients to the wrong tensors, leading to silent convergence failure or hard crashes.</p>",
    "root_cause": "Using unordered collections (like set or pre-3.7 dict) to store model metadata or parameter references, causing different ranks to build different serialization buffers.",
    "bad_code": "class MyModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.params = {'weight': nn.Parameter(torch.randn(10)), 'bias': nn.Parameter(torch.randn(10))}\n\n    def get_metadata(self):\n        # ERROR: dictionary order is not guaranteed across all environments/versions\n        return list(self.params.keys())",
    "solution_desc": "Explicitly sort all keys before serialization or use collections.OrderedDict. Additionally, ensure that any random seeding is synchronized across ranks using a global seed at the start of the process.",
    "good_code": "from collections import OrderedDict\n\nclass MyModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        # Use OrderedDict or sort keys during access\n        self.params = OrderedDict([\n            ('weight', nn.Parameter(torch.randn(10))),\n            ('bias', nn.Parameter(torch.randn(10)))\n        ])\n\n    def get_metadata(self):\n        return sorted(list(self.params.keys()))",
    "verification": "Use `torch.distributed.barrier()` and compare the hash of the state_dict keys across all ranks. If `hash(keys)` differs between Rank 0 and Rank N, serialization is non-deterministic.",
    "date": "2026-03-27",
    "id": 1774574652,
    "type": "error"
});