"""
Libreria di 100 immagini di default (10 per categoria) per gli sconti dei commercianti.
URL diretti Unsplash CDN, ottimizzati a 800x450px.
Estetica europea/mediterranea (evita lo stock "americano" patinato).
Tutti gli URL sono stati verificati con richieste HEAD.
"""

# 800x450 crop centrale, JPEG auto-format, quality 80
_Q = "?w=800&h=450&fit=crop&auto=format&q=80"


def _u(pid: str) -> str:
    """Build the full Unsplash CDN URL for a given photo id."""
    if pid.startswith("premium_"):
        return f"https://plus.unsplash.com/{pid}{_Q}"
    return f"https://images.unsplash.com/{pid}{_Q}"


DEFAULT_IMAGE_LIBRARY = {
    "Ristoranti": [
        _u("photo-1517248135467-4c7edcad34c4"),
        _u("photo-1414235077428-338989a2e8c0"),
        _u("photo-1555396273-367ea4eb4db5"),
        _u("photo-1550966871-3ed3cdb5ed0c"),
        _u("photo-1592861956120-e524fc739696"),
        _u("photo-1533777324565-a040eb52facd"),
        _u("photo-1481931098730-318b6f776db0"),
        _u("photo-1544025162-d76694265947"),
        _u("photo-1559339352-11d035aa65de"),
        _u("photo-1476224203421-9ac39bcb3327"),
    ],
    "Pizzerie e Forni": [
        _u("photo-1513104890138-7c749659a591"),
        _u("photo-1574071318508-1cdbab80d002"),
        _u("photo-1590947132387-155cc02f3212"),
        _u("photo-1600028068383-ea11a7a101f3"),
        _u("photo-1594007654729-407eedc4be65"),
        _u("photo-1608198093002-ad4e005484ec"),
        _u("photo-1509440159596-0249088772ff"),
        _u("photo-1568254183919-78a4f43a2877"),
        _u("photo-1571066811602-716837d681de"),
        _u("photo-1517686469429-8bdb88b9f907"),
    ],
    "Palestre e Fitness": [
        _u("photo-1534438327276-14e5300c3a48"),
        _u("photo-1571902943202-507ec2618e8f"),
        _u("photo-1517836357463-d25dfeac3438"),
        _u("photo-1581009146145-b5ef050c2e1e"),
        _u("photo-1605296867304-46d5465a13f1"),
        _u("photo-1540497077202-7c8a3999166f"),
        _u("photo-1526506118085-60ce8714f8c5"),
        _u("photo-1518611012118-696072aa579a"),
        _u("photo-1689877020200-403d8542d95d"),
        _u("photo-1571019614242-c5c5dee9f50b"),
    ],
    "Campi da Padel": [
        _u("photo-1646649853703-7645147474ba"),
        _u("photo-1658723826297-fe4d1b1e6600"),
        _u("photo-1612534847738-b3af9bc31f0c"),
        _u("photo-1646649851800-48dba35edc76"),
        _u("photo-1526888935184-a82d2a4b7e67"),
        _u("photo-1657704358775-ed705c7388d2"),
        _u("photo-1646651105426-e8c8ee9badde"),
        _u("photo-1646649853517-e2f75cde1908"),
        _u("photo-1574379989050-bfd9e1a8a543"),
        _u("photo-1646649852033-7e0f3d679f8b"),
    ],
    "Campi da Calcetto": [
        _u("photo-1587384474964-3a06ce1ce699"),
        _u("photo-1606925797300-0b35e9d1794e"),
        _u("photo-1630420598913-44208d36f9af"),
        _u("photo-1553627220-92f0446b6a5f"),
        _u("photo-1630420598771-dd52ab08c8cb"),
        _u("photo-1695950695168-f4038b55a9ca"),
        _u("photo-1521217078329-f8fc1becab68"),
        _u("photo-1676444920926-c8a084ec4003"),
        _u("photo-1509077613385-f89402467146"),
        _u("photo-1702467430182-f955bb8ced5b"),
    ],
    "Meccanici e Gommisti": [
        _u("photo-1580274455191-1c62238fa333"),
        _u("photo-1486262715619-67b85e0b08d3"),
        _u("photo-1503376780353-7e6692767b70"),
        _u("photo-1615906655593-ad0386982a0f"),
        _u("photo-1520340356584-f9917d1eea6f"),
        _u("photo-1487754180451-c456f719a1fc"),
        _u("photo-1625047509248-ec889cbff17f"),
        _u("photo-1607860108855-64acf2078ed9"),
        _u("photo-1610647752706-3bb12232b3ab"),
        _u("photo-1619642751034-765dfdf7c58e"),
    ],
    "Bar e Caffetterie": [
        _u("photo-1509042239860-f550ce710b93"),
        _u("photo-1495474472287-4d71bcdd2085"),
        _u("photo-1521017432531-fbd92d768814"),
        _u("photo-1442512595331-e89e73853f31"),
        _u("photo-1517701550927-30cf4ba1dba5"),
        _u("photo-1559925393-8be0ec4767c8"),
        _u("photo-1447933601403-0c6688de566e"),
        _u("photo-1445116572660-236099ec97a0"),
        _u("photo-1497935586351-b67a49e012bf"),
        _u("photo-1554118811-1e0d58224f24"),
    ],
    "Parrucchieri ed Estetiste": [
        _u("photo-1585747860715-2ba37e788b70"),
        _u("photo-1503951914875-452162b0f3f1"),
        _u("photo-1560066984-138dadb4c035"),
        _u("photo-1522337360788-8b13dee7a37e"),
        _u("photo-1571781926291-c477ebfd024b"),
        _u("photo-1580618672591-eb180b1a973f"),
        _u("photo-1600334129128-685c5582fd35"),
        _u("photo-1519823551278-64ac92734fb1"),
        _u("photo-1470259078422-826894b933aa"),
        _u("photo-1595475207225-428b62bda831"),
    ],
    "Negozi di Abbigliamento": [
        _u("photo-1441986300917-64674bd600d8"),
        _u("photo-1567401893414-76b7b1e5a7a5"),
        _u("photo-1490481651871-ab68de25d43d"),
        _u("photo-1483985988355-763728e1935b"),
        _u("photo-1555529669-e69e7aa0ba9a"),
        _u("photo-1489987707025-afc232f7ea0f"),
        _u("photo-1571945153237-4929e783af4a"),
        _u("photo-1523381210434-271e8be1f52b"),
        _u("photo-1479064555552-3ef4979f8908"),
        _u("photo-1445205170230-053b83016050"),
    ],
    "Alimentari e Fruttivendoli": [
        _u("photo-1488459716781-31db52582fe9"),
        _u("photo-1542838132-92c53300491e"),
        _u("photo-1518977676601-b53f82aba655"),
        _u("photo-1506617564039-2f3b650b7010"),
        _u("photo-1534723452862-4c874018d66d"),
        _u("photo-1444459094717-a39f1e3e0903"),
        _u("photo-1573246123716-6b1782bfc499"),
        _u("photo-1550989460-0adf9ea622e2"),
        _u("photo-1610348725531-843dff563e2c"),
        _u("photo-1524499982521-1ffd58dd89ea"),
    ],
}


def list_categories() -> list:
    return list(DEFAULT_IMAGE_LIBRARY.keys())


def all_images_flat() -> list:
    out = []
    for cat, urls in DEFAULT_IMAGE_LIBRARY.items():
        for u in urls:
            out.append({"category": cat, "url": u})
    return out
