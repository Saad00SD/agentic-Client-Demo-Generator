import os
import json
from pathlib import Path
from typing import List, Dict, Any
from backend.observability import instrument

LOCALE_TEMPLATES = {
    "en": {
        "nav": {
            "home": "Home",
            "campaigns": "Campaigns",
            "shop": "Shop",
            "pointsBank": "Points Bank",
            "voucherWallet": "Voucher Wallet",
            "help": "Help",
            "analytic": "AI Analytic"
        },
        "roles": {
            "label": "Role",
            "tradeCustomer": "Trade customer",
            "workshopOwner": "Workshop Owner",
            "workshopManager": "Workshop Manager",
            "partsBuyer": "Parts Buyer",
            "branchManager": "Branch Manager",
            "areaSalesManager": "Area Sales Manager",
            "regionalSalesDirector": "Regional Sales Director",
            "programmeOffice": "Programme Office · National"
        },
        "hero": {
            "homeTitle": "Every part you buy <em>moves you forward</em>",
            "homeLede": "Your trade account, your targets and your rewards in one place.",
            "campaignsTitle": "Welcome to <em>Campaigns</em>",
            "campaignsLede": "Every campaign open to your account."
        },
        "sections": {
            "campaignsRunningNow": "Campaigns running now",
            "latestCampaigns": "Latest campaigns",
            "workshopOfTheQuarter": "Workshop of the Quarter",
            "exploreRewards": "Explore rewards",
            "openCampaign": "Open campaign →",
            "learnMore": "Learn more",
            "subscribeNow": "Subscribe Now",
            "getUpdates": "Get updates straight to your inbox",
            "termsOfUse": "Terms of use",
            "registrationSupport": "Registration Support",
            "demonstrationBuild": "Demonstration build · illustrative data throughout"
        }
    },
    "ro": {
        "nav": {
            "home": "Acasă",
            "campaigns": "Campanii",
            "shop": "Magazin",
            "pointsBank": "Bancă de Puncte",
            "voucherWallet": "Portofel Vouchere",
            "help": "Ajutor",
            "analytic": "Analiză AI"
        },
        "roles": {
            "label": "Rol",
            "tradeCustomer": "Client comercial",
            "workshopOwner": "Proprietar Atelier",
            "workshopManager": "Manager Atelier",
            "partsBuyer": "Cumpărător Piese",
            "branchManager": "Manager Sucursală",
            "areaSalesManager": "Manager Vânzări Zonal",
            "regionalSalesDirector": "Director Vânzări Regional",
            "programmeOffice": "Birou Program · Național"
        },
        "hero": {
            "homeTitle": "Fiecare piesă cumpărată <em>te duce mai departe</em>",
            "homeLede": "Contul tău comercial, obiectivele și recompensele tale într-un singur loc.",
            "campaignsTitle": "Bine ai venit la <em>Campanii</em>",
            "campaignsLede": "Toate campaniile deschise pentru contul tău."
        },
        "sections": {
            "campaignsRunningNow": "Campanii în desfășurare",
            "latestCampaigns": "Ultimele campanii",
            "workshopOfTheQuarter": "Atelierul Trimestrului",
            "exploreRewards": "Explorează recompense",
            "openCampaign": "Deschide campania →",
            "learnMore": "Află mai multe",
            "subscribeNow": "Abonează-te Acum",
            "getUpdates": "Primește noutăți direct pe email",
            "termsOfUse": "Termeni de utilizare",
            "registrationSupport": "Suport Înregistrare",
            "demonstrationBuild": "Versiune de demonstrație · date ilustrative"
        }
    },
    "fr": {
        "nav": {
            "home": "Accueil",
            "campaigns": "Campagnes",
            "shop": "Boutique",
            "pointsBank": "Banque de Points",
            "voucherWallet": "Portefeuille de Bons",
            "help": "Aide",
            "analytic": "Analyse IA"
        },
        "roles": {
            "label": "Rôle",
            "tradeCustomer": "Client professionnel",
            "workshopOwner": "Propriétaire d'Atelier",
            "workshopManager": "Gestionnaire d'Atelier",
            "partsBuyer": "Acheteur de Pièces",
            "branchManager": "Directeur d'Agence",
            "areaSalesManager": "Responsable Ventes Secteur",
            "regionalSalesDirector": "Directeur Régional",
            "programmeOffice": "Bureau du Programme"
        },
        "hero": {
            "homeTitle": "Chaque pièce achetée <em>vous fait avancer</em>",
            "homeLede": "Votre compte professionnel et vos récompenses.",
            "campaignsTitle": "Bienvenue dans <em>Campagnes</em>",
            "campaignsLede": "Toutes les campagnes ouvertes à votre compte."
        },
        "sections": {
            "campaignsRunningNow": "Campagnes en cours",
            "latestCampaigns": "Dernières campagnes",
            "workshopOfTheQuarter": "Atelier du Trimestre",
            "exploreRewards": "Explorer les récompenses",
            "openCampaign": "Ouvrir la campagne →",
            "learnMore": "En savoir plus",
            "subscribeNow": "S'abonner maintenant",
            "getUpdates": "Recevez les mises à jour directement",
            "termsOfUse": "Conditions d'utilisation",
            "registrationSupport": "Support d'inscription",
            "demonstrationBuild": "Démo d'illustration · données fictives"
        }
    }
}

@instrument("localization.generate")
def generate_locales(output_dir: str, languages: List[Dict[str, str]], client_name: str, platform_name: str) -> List[str]:
    locales_dir = Path(output_dir) / "locales"
    os.makedirs(locales_dir, exist_ok=True)

    generated_files = []
    for lang in languages:
        code = lang.get("code", "en").lower()

        # Get base template or fallback to English template
        base = LOCALE_TEMPLATES.get(code, LOCALE_TEMPLATES["en"])

        # Deep copy to format custom client & platform strings
        locale_data = json.loads(json.dumps(base))

        # Write file
        file_path = locales_dir / f"{code}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(locale_data, f, indent=2, ensure_ascii=False)

        generated_files.append(str(file_path))

    return generated_files
