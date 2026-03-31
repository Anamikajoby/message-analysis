import re
import json

class PhishingAnalyzer:
    def __init__(self):
        # Common phishing keywords
        self.suspicious_keywords = [
            r'urgent', r'action required', r'account suspended', 
            r'verify your account', r'login immediately', r'security alert',
            r'unauthorized access', r'password reset', r'click here'
        ]
        
        # Regex for URLs
        self.url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'

    def analyze(self, text):
        """
        Analyzes a message for common phishing signals.
        """
        results = {
            "risk_score": 0,
            "signals": [],
            "urls_detected": []
        }

        # Check for keywords
        found_keywords = []
        for keyword in self.suspicious_keywords:
            if re.search(keyword, text, re.IGNORECASE):
                found_keywords.append(keyword)
        
        if found_keywords:
            results["risk_score"] += len(found_keywords) * 10
            results["signals"].append(f"Suspicious keywords detected: {', '.join(found_keywords)}")

        # Check for URLs
        urls = re.findall(self.url_pattern, text)
        results["urls_detected"] = list(set(urls))
        
        if len(urls) > 2:
            results["risk_score"] += 15
            results["signals"].append("High number of embedded URLs detected.")

        # Check for sense of urgency
        if re.search(r'immediately|within \d+ hours|as soon as possible', text, re.IGNORECASE):
            results["risk_score"] += 20
            results["signals"].append("High sense of urgency detected in language.")

        # Cap risk score at 100
        results["risk_score"] = min(results["risk_score"], 100)
        
        return results

if __name__ == "__main__":
    # Example usage
    sample_message = """
    Subject: URGENT: Security Alert for your Account
    
    We detected unauthorized access to your account. Please click here to verify your identity immediately:
    http://secure-login-verify.com/auth
    
    Failure to do so within 24 hours will result in permanent account suspension.
    """
    
    analyzer = PhishingAnalyzer()
    analysis = analyzer.analyze(sample_message)
    
    print(json.dumps(analysis, indent=4))
