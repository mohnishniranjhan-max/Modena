/**
 * Handles PDF Export logic using the native browser Print engine
 * which is explicitly optimized via print.css
 */

export const setupPdfExport = () => {
    const exportBtn = document.getElementById('btn-export-pdf');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            // Trigger native print dialog which allows "Save as PDF"
            // This is the most reliable way to maintain A4 formatting,
            // high-resolution images, and selectable text without heavy external libraries.
            window.print();
        });
    }
};
