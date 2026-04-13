import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // Disable WebView bounce so the navbar doesn't detach from the status bar
        webView?.scrollView.bounces = false
    }
}
