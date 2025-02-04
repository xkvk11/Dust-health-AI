import time

from requests import request
from rest_framework.utils import json

url = 'http://apis.data.go.kr/B552584/ArpltnStatsSvc/getCtprvnMesureSidoLIst'
service_key = 'pVHLUl3UGVDmm+B0aUxMttCQnoCePxtWLb4WJKushUW6XjTX93l89IkU/dELSR6nZ318fR3efuSBb3gVpjAFFA=='
params = {
    'sidoName': '전남',
    'serviceKey': service_key,
    'returnType': 'json',
    'numOfRows': 1000,
    'searchCondition': 'DAILY'
}
result_data = {}
region_list = ['서울', '부산', '대구', '광주', '제주', '울산', '대전', '경북', '경남', '전북', '전남', '강원', '충북', '충남', '경기']
for region in region_list:
    params['sidoName'] = region
    this_area = []
    region_data = request('get', url, params=params).json()
    for data in region_data['response']['body']['items']:
        print(data)
        this_area.append(data['cityName'])
    this_area = list(set(this_area))
    result_data[region] = this_area
    time.sleep(1)
with open('addr_v2.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(result_data, indent=4, ensure_ascii=False))
# region_data = region_data['response']['body']['items']
# area = []
# for address in region_data:
#     tmp = address['addr'].split(' ')
#     area.append(f'{tmp[0][:2]} {address['stationName']}')
# area = set(area)
# result = {}
# for aaa in area:
#     si = aaa.split(' ')[0]
#     goon = aaa.split(' ')[1]
#     if si not in result:
#         result[si] = []
#     result[si].append(goon)
# with open('addr.json', 'w', encoding='utf-8') as f:
#     f.write(json.dumps(result, indent=4, ensure_ascii=False))
#