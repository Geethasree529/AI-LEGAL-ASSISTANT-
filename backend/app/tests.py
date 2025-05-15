from django.test import TestCase, Client
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import UploadedPDF
import json
import os
class PDFUploadTests(TestCase):

    def setUp(self):
        self.client = Client()

    def test_upload_pdf(self):
        file_path = '/home/foxtrot/Documents/ECE3111.pdf'
        self.assertTrue(os.path.exists(file_path), f"File '{file_path}' does not exist.")
        self.assertTrue(os.access(file_path, os.R_OK), f"File '{file_path}' is not readable.")
        with open(file_path, 'rb') as f:
            uploaded_file = SimpleUploadedFile('ECE3111.pdf', f.read(), content_type='application/pdf')
            response = self.client.post(reverse('pdf-upload'), {'pdf_file': uploaded_file}, format='multipart')
        self.assertEqual(response.status_code, 201, f"Expected status code 201, but got {response.status_code}")

    def test_retrieve_pdf(self):
        pdf = UploadedPDF.objects.create(pdf_file=SimpleUploadedFile('file.pdf', b'pdf content'))
        response = self.client.get(reverse('pdf-retrieve', kwargs={'pk': pdf.pk}))       
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('pdf_file', data)
        
    def test_delete_pdf(self):
        pdf = UploadedPDF.objects.create(pdf_file=SimpleUploadedFile('file.pdf', b'pdf content'))
        response = self.client.delete(reverse('pdf-delete', kwargs={'pk': pdf.pk}))
        self.assertEqual(response.status_code, 204)  # Check if delete is successful
        self.assertFalse(UploadedPDF.objects.filter(pk=pdf.pk).exists())  # Check if PDF is deleted from database
