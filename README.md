## frontend에 추가로 다운받을것
```
npm install react-arc-progress -S
npm install @mui/x-charts @mui/base @mui/joy @mui/icons-material @emotion/styled @emotion/react @mui/styled-engine react-cookie @uiw/react-md-editor
```

## frontend 루트 디렉터리에 .env 파일 생성 후 아래의 내용을 기재 후 저장
```
REACT_APP_API_URL=http://127.0.0.1:8000
REACT_APP_API_KEY=pVHLUl3UGVDmm%2BB0aUxMttCQnoCePxtWLb4WJKushUW6XjTX93l89IkU%2FdELSR6nZ318fR3efuSBb3gVpjAFFA%3D%3D
```
이후 npm start 로 실행 ...

## 주의사항
```
실행 후 호스트 주소 변경 필요

기본 실행 호스트가 http://localhost:3000인데

http://127.0.0.1:3000 으로 바꿔서 접속해야 정상 실행 (CORS 오류)
```