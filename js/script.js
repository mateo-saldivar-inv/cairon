document.addEventListener('DOMContentLoaded', function () {
    const banner = document.getElementById('banner');
    const numStars = 20; 
    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('span');
      star.classList.add('star');
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      banner.appendChild(star);
    }
  
    const pdfUrl = 'document.pdf'; 
    const pdfViewer = document.getElementById('pdf-viewer');
  
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js';
  
    pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc) {
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        pdfDoc.getPage(pageNum).then(function(page) {
          const scale = 1.5;
          const viewport = page.getViewport({ scale: scale });
  
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          pdfViewer.appendChild(canvas);
  
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          page.render(renderContext);
        });
      }
    }).catch(function(error) {
      console.error('Error loading PDF: ' + error);
    });
  });
  