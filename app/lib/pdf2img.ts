export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    try {
        loadPromise = import("pdfjs-dist").then(async (lib) => {
            // Set the worker source to use local file
            lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            pdfjsLib = lib;
            return lib;
        });

        return await loadPromise;
    } catch (error) {
        console.error("Failed to load PDF.js:", error);
        throw new Error("Failed to load PDF processing library");
    }
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        if (!file || file.type !== 'application/pdf') {
            return {
                imageUrl: "",
                file: null,
                error: "Invalid file type. Please provide a PDF file.",
            };
        }

        const lib = await loadPdfJs();
        
        if (!lib) {
            return {
                imageUrl: "",
                file: null,
                error: "Failed to load PDF processing library",
            };
        }

        const arrayBuffer = await file.arrayBuffer();
        
        const loadingTask = lib.getDocument({ 
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
            cMapPacked: true,
        });
        
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
            return {
                imageUrl: "",
                file: null,
                error: "Failed to get canvas context",
            };
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err: any) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}