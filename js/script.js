document.addEventListener('DOMContentLoaded', function () {
    // Render stars in the banner
    const banner = document.getElementById('banner');
    const numStars = 20; // Adjust the number of stars as desired
    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('span');
      star.classList.add('star');
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      banner.appendChild(star);
    }
  
    // PDF.js integration for infinite scroll PDF viewer
    const pdfUrl = 'document.pdf'; // Ensure this is the correct path to your PDF
    const pdfViewer = document.getElementById('pdf-viewer');
  
    // Set up PDF.js worker from CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js';
  
    // Load the PDF document
    pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc) {
      // Loop through each page and render it
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        pdfDoc.getPage(pageNum).then(function(page) {
          const scale = 1.5;
          const viewport = page.getViewport({ scale: scale });
  
          // Create a canvas element for each page
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Append the canvas to the PDF viewer container
          pdfViewer.appendChild(canvas);
  
          // Render the page into the canvas context
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
  