from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from openai import OpenAI
client = OpenAI()

# Create your views here.

def compact(req,pm,dis):
    completion = client.chat.completions.create(
    model="gpt-4o-mini", # gpt-3.5-turbo, text-embedding-3-small
    messages=[
    {
      "role": "user",
      "content": [{ "type": "text", "text": "미세먼지 농도가 "+pm+" µg/m³일 때 "+dis+" 환자를 위한 미세먼지 의사의 권고 사항을 1줄로 적어줘." }]
    }
    ]
)
    print('**///////////////////////// pm : '+pm)
    print('**///////////////////////// dis : '+dis)
    context={'response': completion.choices[0].message.content}
    return JsonResponse(data=context)

def complex(req,pm,dis):
    completion = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
    {
      "role": "user",
      "content": [{ "type": "text", "text": "미세먼지 농도가 "+pm+" µg/m³일 때 "+dis+" 환자를 위한 미세먼지 의사의 권고 사항을 길게." }]
    }
    ]
)
    print('**///////////////////////// pm : '+pm)
    print('**///////////////////////// dis : '+dis)
    context={'response': completion.choices[0].message.content}
    return JsonResponse(data=context)