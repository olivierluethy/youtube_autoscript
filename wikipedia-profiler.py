import requests

def get_place_image(place_name):
    url = "https://commons.wikimedia.org/w/api.php"

    headers = {
        "User-Agent": "OrtAPI/1.0 (kontakt@example.com)"  
        # Ersetze die E-Mail durch deine (oder irgendeine gültige)
    }

    params = {
        "action": "query",
        "titles": place_name,
        "prop": "pageimages",
        "format": "json",
        "pithumbsize": 1000,
        "origin": "*"
    }

    response = requests.get(url, params=params, headers=headers)

    if response.status_code != 200:
        print("HTTP Fehler:", response.status_code)
        print(response.text)
        return None

    try:
        data = response.json()
    except Exception as e:
        print("Konnte JSON nicht parsen!")
        print("Antwort war:")
        print(response.text)
        return None
    
    pages = data.get("query", {}).get("pages", {})
    for _, page in pages.items():
        thumb = page.get("thumbnail")
        if thumb:
            return thumb["source"]

    return None


# Testen:
image_url = get_place_image("Taylor Swift")
print("Bild URL:", image_url)
