import UIKit

enum ImageUploadPrep {
    /// Downscale and JPEG-compress before Cloud Run upload (avoids huge simulator photos + connection drops).
    static func jpegForUpload(from data: Data, maxEdge: CGFloat = 1024, quality: CGFloat = 0.78) -> Data {
        guard let image = UIImage(data: data) else { return data }
        let scaled = scale(image, maxEdge: maxEdge)
        return scaled.jpegData(compressionQuality: quality) ?? data
    }

    private static func scale(_ image: UIImage, maxEdge: CGFloat) -> UIImage {
        let size = image.size
        let longest = max(size.width, size.height)
        guard longest > maxEdge else { return image }
        let scale = maxEdge / longest
        let newSize = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}
