# Bolivia Currency Validator (LLM-Powered)

A specialized tool designed to automate the verification of currency serial numbers in Bolivia, providing immediate peace of mind by identifying restricted or discontinued series.

## ⚠️ The Context
Following a series of unfortunate events in Bolivia, certain bill series were declared illegal or restricted by authorities. This created a significant issue for the general public: the need to constantly check long, complex serial numbers against official lists to ensure their money was legitimate. This manual process was not only tedious but prone to human error, causing confusion and distrust in daily transactions.

## 💡 The Solution
I developed this application to eliminate the manual burden of checking serial numbers. By leveraging the multimodal capabilities of **Gemini**, users can simply snap a photo of their bill. The model processes the image and extracts the information based on a specific prompt, instantly cross-referencing the serial number against the official database of restricted series.

## 🚀 Why Google AI Studio?
The core decision to use **Google AI Studio** was driven by accessibility and scalability:
* **Fast Development:** It allowed for rapid prototyping and deployment without complex infrastructure.
* **Democratization:** By using the free tier provided by Google AI Studio, the solution is accessible to anyone. 
* **Portability:** Users can easily copy the project and run it on their mobile devices, ensuring that a tool to verify currency security is available to everyone, everywhere, at no cost.


## 📝 How it Works
1.  **Capture:** The user takes a photo of the bill's serial number.
2.  **Analyze:** The image is sent to Gemini via Google AI Studio with a structured prompt to ensure precise extraction of the serial number.
3.  **Validate:** The system performs a pattern check against the government-issued lists of restricted series.
4.  **Result:** The application provides immediate confirmation on the bill's status.

---

### 🛡️ Disclaimer
*This tool is intended for personal convenience and verification purposes. It does not replace the official procedures or the final verification by authorized financial institutions.*
