import os
import json
import re
from typing import Dict, Any
from backend.models.client_config import ClientConfig

def extract_client_config_from_prompt(prompt: str) -> Dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY")

    if api_key:
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(api_key=api_key, model="gpt-4o-mini", temperature=0)
            structured_llm = llm.with_structured_output(ClientConfig)
            res = structured_llm.invoke(f"Extract client configuration for demo generator from this prompt: {prompt}")
            return res.model_dump()
        except Exception as e:
            print(f"LLM extraction error: {e}. Falling back to rule-based extractor.")

    # Rule-based fallback extractor
    config = ClientConfig().model_dump()

    # Client name extraction
    match_client = re.search(r'(?:client|for)\s+([A-Z][a-zA-Z0-9\s]+?)(?=\s+demo|\s+called|\s+for|\.|$)', prompt, re.IGNORECASE)
    if match_client:
        config["clientName"] = match_client.group(1).strip()
    elif "renault" in prompt.lower():
        config["clientName"] = "Renault"
    elif "bmw" in prompt.lower():
        config["clientName"] = "BMW Group"
    elif "ford" in prompt.lower():
        config["clientName"] = "Ford Pro"

    # Platform name extraction
    match_platform = re.search(r'(?:called|platform|named)\s+([A-Z][a-zA-Z0-9]+)', prompt, re.IGNORECASE)
    if match_platform:
        config["platformName"] = match_platform.group(1).strip()

    # Country extraction
    if "romania" in prompt.lower():
        config["country"] = {"code": "RO", "name": "Romania", "currency": "RON", "symbol": "RON", "pointsRatio": 100}
        config["countryConfig"] = {
            "country": "Romania",
            "regions": ["Bucharest", "Transylvania", "Moldavia", "Banat"],
            "branches": ["Bucharest Central", "Cluj-Napoca", "Timișoara", "Iași"],
            "defaultBranch": "Bucharest Central"
        }
        config["customer"]["town"] = "Bucharest"
        config["customer"]["branch"] = "Bucharest Central"
        config["customer"]["business"] = f"{config['clientName']} Auto Central"
    elif "germany" in prompt.lower():
        config["country"] = {"code": "DE", "name": "Germany", "currency": "EUR", "symbol": "€", "pointsRatio": 100}
        config["countryConfig"] = {
            "country": "Germany",
            "regions": ["Bavaria", "North Rhine", "Hesse", "Baden-Württemberg"],
            "branches": ["Munich", "Frankfurt", "Cologne", "Stuttgart"],
            "defaultBranch": "Munich"
        }
        config["customer"]["town"] = "Munich"

    # Languages extraction
    langs = []
    if "english" in prompt.lower():
        langs.append({"code": "en", "label": "English"})
    if "romanian" in prompt.lower() or "română" in prompt.lower():
        langs.append({"code": "ro", "label": "Română"})
    if "french" in prompt.lower() or "français" in prompt.lower():
        langs.append({"code": "fr", "label": "Français"})
    if "german" in prompt.lower() or "deutsch" in prompt.lower():
        langs.append({"code": "de", "label": "Deutsch"})

    if langs:
        config["languages"] = langs

    # Color extraction
    hex_colors = re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}\b', prompt)
    if len(hex_colors) >= 1:
        config["branding"]["primaryColor"] = hex_colors[0]
    if len(hex_colors) >= 2:
        config["branding"]["secondaryColor"] = hex_colors[1]
    if len(hex_colors) >= 3:
        config["branding"]["accentColor"] = hex_colors[2]

    # Campaigns extraction
    campaign_names = []
    if "sales challenge" in prompt.lower():
        campaign_names.append("Sales Challenge 2026")
    if "service excellence" in prompt.lower():
        campaign_names.append("Service Excellence")
    if "summer rewards" in prompt.lower():
        campaign_names.append("Summer Rewards")
    if "parts promotion" in prompt.lower():
        campaign_names.append("Parts Promotion")

    if campaign_names:
        camps = []
        for idx, name in enumerate(campaign_names):
            camps.append({
                "id": f"camp-{idx+1}",
                "name": name,
                "type": "Hit & Win Incentive",
                "img": "assets/img/drive-handover.jpg",
                "tileImage": "assets/img/drive-handover.jpg",
                "blurb": f"Boost performance with {name}.",
                "status": "Active"
            })
        config["campaigns"] = camps

    return config
