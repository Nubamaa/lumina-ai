import importlib.util
import os
spec = importlib.util.spec_from_file_location('mod', os.path.join(os.path.dirname(__file__), 'app.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
print('Registered routes:')
for rule in sorted(mod.app.url_map.iter_rules(), key=lambda r: r.rule):
    print(f"{rule.rule} -> {','.join(sorted(rule.methods))}")
