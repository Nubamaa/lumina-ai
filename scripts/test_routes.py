from importlib.util import spec_from_file_location, module_from_spec
spec = spec_from_file_location('appmod', r'lumina-ai/backend/app.py')
mod = module_from_spec(spec)
spec.loader.exec_module(mod)
client = mod.app.test_client()
for path in ['/api/generate','/api/history','/api/history/save']:
    resp = client.get(path)
    print(path, resp.status_code)
    print(resp.get_data(as_text=True)[:200])
    print('-----')
