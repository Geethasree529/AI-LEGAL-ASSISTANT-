from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import UploadedPDF
from .serializers import UploadedPDFSerializer
from .utils import prompt
import json
from rest_framework.decorators import api_view

@api_view(['GET'])
def test_connection(request):
    if request.method == 'GET':
        return JsonResponse(data={
            "message":"Working",
        }, status=200)
    return JsonResponse(data={
        "message":"Healty",
    }, status=200)

@csrf_exempt
def upload_pdf(request):
    if request.method == 'POST':
        serializer = UploadedPDFSerializer(data=request.FILES)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=201)
        return JsonResponse(serializer.errors, status=400)
    return JsonResponse({'error': 'POST method required'}, status=400)

@csrf_exempt
def retrieve_pdf(request, pk):
    pdf = get_object_or_404(UploadedPDF, pk=pk)
    if request.method == 'POST':
        serializer = UploadedPDFSerializer(pdf)
        data = json.loads(request.body)
        data = prompt(message=data.get('message'),file=serializer.data['pdf_file'],history=data.get('history'))
        return JsonResponse({"response":data}, status=200)
    return JsonResponse({'error': 'GET method required'}, status=400)

@csrf_exempt
def delete_pdf(request, pk):
    pdf = get_object_or_404(UploadedPDF, pk=pk)
    if request.method == 'DELETE':
        pdf.delete()
        return JsonResponse({'message': 'PDF deleted successfully'}, status=204)

    return JsonResponse({'error': 'DELETE method required'}, status=400)
