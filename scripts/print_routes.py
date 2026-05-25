from importlib.util import spec_from_file_location, module_from_spec
spec = spec_from_file_location("appmod", r"lumina-ai/backend/app.py")
mod = module_from_spec(spec)
spec.loader.exec_module(mod)
print(mod.app.url_map)
