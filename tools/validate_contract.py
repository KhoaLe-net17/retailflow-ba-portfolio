"""Validate the OpenAPI description and captured HTTP responses against JSON Schema."""
import json
from pathlib import Path
from datetime import datetime, timezone
import yaml
from openapi_spec_validator import validate
from jsonschema import Draft202012Validator, FormatChecker

ROOT=Path(__file__).resolve().parents[1]
spec=yaml.safe_load((ROOT/'api/openapi.yaml').read_text(encoding='utf-8'))
validate(spec)
samples=json.loads((ROOT/'evidence/http-samples.json').read_text(encoding='utf-8'))
checked=[]
for sample in samples:
 operation=spec['paths'][sample['path']][sample['method']]
 response=operation['responses'][str(sample['status'])]
 schema={'$schema':'https://json-schema.org/draft/2020-12/schema',**response['content']['application/json']['schema'],'components':spec['components']}
 Draft202012Validator(schema,format_checker=FormatChecker()).validate(sample['body'])
 checked.append({'path':sample['path'],'method':sample['method'],'status':sample['status'],'result':'PASS'})
result={'executedAt':datetime.now(timezone.utc).isoformat(),'tool':'openapi-spec-validator + jsonschema Draft202012Validator','openapi':spec['openapi'],'description':'PASS','capturedResponses':checked,'boundary':'Actual local HTTP responses; not a provider integration or production compatibility test.'}
(ROOT/'evidence/contract-validation.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(f'OpenAPI {spec["openapi"]}: PASS; {len(checked)} captured HTTP response schemas: PASS')
