import requests
import pandas as pd
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from rest_framework.decorators import api_view
from rest_framework.response import Response

# API URL과 키 설정
API_URL = "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty"
API_KEY = "zhvs5TlKznNkfpG91l4BPgIcZtbsxovufWhyA4+w2KcaA1dp6RsGVOYHyD91i/XzDfAqOFIdScVjvbElsw+BCQ=="  # OpenAPI 인증키

# 지역 정보 (시와 구)
regions = {
    '서울': [ '강남구', '강동구',   '강북구',
                '강서구', '관악구',   '광진구',
                '구로구', '금천구',   '노원구',
                '도봉구', '동대문구', '동작구',
                '마포구', '서대문구', '서초구',
                '성동구', '성북구',   '송파구',
                '양천구', '영등포구', '용산구',
                '은평구', '종로구',   '중구',
                '중랑구'
            ],
    '부산': [ '강서구',   '금정구',
                '기장군',   '남구',
                '동구',     '동래구',
                '부산진구', '북구',
                '사상구',   '사하구',
                '서구',     '수영구',
                '연제구',   '영도구',
                '중구',     '해운대구'
            ],
    '대구':   [  '남구',   '달서구',
                '달성군', '동구',
                '북구',   '서구',
                '수성구', '중구',
                '군위군'
            ],
    '인천':   [ '강화군',   '계양구',
                '미추홀구', '남동구',
                '동구',     '부평구',
                '서구',     '연수구',
                '옹진군',   '중구'
            ],
    '광주': [ '광산구', '남구', '동구', '북구', '서구'],
    '대전': [ '대덕구', '동구', '서구', '유성구', '중구'],
    '울산': [ '남구', '동구', '북구', '울주군', '중구' ],
    '세종': [ '세종시'],
    '경기': [  '가평군',   '고양시', '과천시',
                '광명시',   '광주시', '구리시',
                '군포시',   '김포시', '남양주시',
                '동두천시', '부천시', '성남시',
                '수원시',   '시흥시', '안산시',
                '안성시',   '안양시', '양주시',
                '양평군',   '여주시', '연천군',
                '오산시',   '용인시', '의왕시',
                '의정부시', '이천시', '파주시',
                '평택시',   '포천시', '하남시',
                '화성시'
            ],
    '강원': [ '강릉시', '고성군', '동해시',
                '삼척시', '속초시', '양구군',
                '양양군', '영월군', '원주시',
                '인제군', '정선군', '철원군',
                '춘천시', '태백시', '평창군',
                '홍천군', '화천군', '횡성군'
            ],
    '충북': [ '괴산군', '단양군',
                '보은군', '영동군',
                '옥천군', '음성군',
                '제천시', '진천군',
                '청주시', '충주시',
                '증평군'
            ],
    '충남': [ '공주시', '금산군',
                '논산시', '당진시',
                '보령시', '부여군',
                '서산시', '서천군',
                '아산시', '예산군',
                '천안시', '청양군',
                '태안군', '홍성군',
                '계룡시'
            ],
    '전북': [ '고창군', '군산시',
                '김제시', '남원시',
                '무주군', '부안군',
                '순창군', '완주군',
                '익산시', '임실군',
                '장수군', '전주시',
                '정읍시', '진안군'
            ],
    '전남': [ '강진군', '고흥군', '곡성군',
                '광양시', '구례군', '나주시',
                '담양군', '목포시', '무안군',
                '보성군', '순천시', '신안군',
                '여수시', '영광군', '영암군',
                '완도군', '장성군', '장흥군',
                '진도군', '함평군', '해남군',
                '화순군'
            ],
    '경북': [ '경산시', '경주시', '구미시',
                '김천시', '문경시', '봉화군',
                '상주시', '성주군', '안동시',
                '영덕군', '영양군', '영주시',
                '영천시', '예천군', '울릉군',
                '울진군', '의성군', '청도군',
                '청송군', '칠곡군', '포항시'
            ],
    '경남': [ '거제시', '거창군', '고성군',
                '김해시', '남해군', '밀양시',
                '사천시', '산청군', '양산시',
                '의령군', '진주시', '창녕군',
                '창원시', '통영시', '하동군',
                '함안군', '함양군', '합천군'
            ],
    '제주': [ '서귀포시', '제주시'],
}

@api_view(['GET'])
def predict_dust(request):
    all_predictions = {}

    for city, districts in regions.items():
        for district in districts:
            params = {
                "serviceKey": API_KEY,
                "returnType": "json",
                "numOfRows": "100",
                "pageNo": "1",
                "stationName": district,
                "dataTerm": "MONTH",
                "ver": "1.0"
            }

            try:
                # API 요청
                response = requests.get(API_URL, params=params)
                print(f"요청 URL: {response.url}")

                if response.status_code != 200:
                    raise Exception(f"HTTP {response.status_code}: {response.text}")

                try:
                    data = response.json()
                except Exception as e:
                    raise Exception(f"JSON 파싱 실패: {str(e)}, 응답: {response.text}")

                # 데이터 가공
                items = data.get("response", {}).get("body", {}).get("items", [])
                if not items:
                    raise Exception(f"{district} 지역에서 데이터를 찾을 수 없습니다.")

                # 데이터프레임 생성
                df = pd.DataFrame([{
                    "date": item.get("dataTime"),
                    "pm10": item.get("pm10Value")
                } for item in items])

                # 데이터 전처리
                df['date'] = df['date'].str.replace(" 24:00", " 00:00")
                df['date'] = pd.to_datetime(df['date'], format="%Y-%m-%d %H:%M", errors='coerce')
                df['pm10'] = pd.to_numeric(df['pm10'], errors='coerce')
                df.dropna(inplace=True)
                df['timestamp'] = df['date'].apply(lambda x: x.timestamp())

                if df.empty:
                    raise Exception(f"{district} 지역에 유효한 데이터가 없습니다.")

                # 모델 학습
                X = df[['timestamp']]
                y = df['pm10']
                model = LinearRegression()
                model.fit(X, y)

                # 미래 3일 예측
                future_dates = [(datetime.now() + timedelta(days=i)).timestamp() for i in range(1, 4)]
                predictions = model.predict(pd.DataFrame(future_dates))

                # 예측 결과 저장
                if city not in all_predictions:
                    all_predictions[city] = {}
                all_predictions[city][district] = {
                    "future_dates": [(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(1, 4)],
                    "predictions": [round(p) for p in predictions]
                }

            except Exception as e:
                print(f"오류 ({city} - {district}): {str(e)}")
                if city not in all_predictions:
                    all_predictions[city] = {}
                all_predictions[city][district] = {"error": str(e)}

    return Response(all_predictions)
