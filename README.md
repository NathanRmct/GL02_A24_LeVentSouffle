# GL02_A24_LeVentSouffle

Le but de ce projet a pour objectif d’aider les enseignants à se familiariser avec des moyens informatiques d’évaluation, permettant d’accéder à une large banque de question, mais aussi d’optimiser la gestion et la préparations de tests et d’examens.


## Installation
Pour installer ce projet vous aurez besoin de le cloner sur votre ordinateur : 
```bash
git clone 
```

Ensuite, il vous faudra installer les dépendances suivantes : 

├── @caporal/core@2.0.7

├── colors@1.4.0

├── fs@0.0.1-security

├── jasmine@5.5.0

├── open@8.4.2

├── pah@1.0.0

├── path@0.12.7

├── prompt-sync@4.2.0

├── vcards-js@2.10.0

├── vega-lite@5.21.0

└── vega@5.30.0

Vous pouvez effectuer la commande suivante, pour installer toutes les dépendances de `package.json`
```bash
npm install
```
## Commandes
- **checkGift** : commande : 
    ```bash
    node CaporalCli.js checkGift <file>
    ```
    Exemple d'utilisation : 
    ```bash
    node CaporalCli.js checkGift TEST.gift
    ```
- **search** : Retourne les fichiers dans lequel est présent la chaine de caractère ou préviens si la chaine de caractère n'est dans aucun fichier. commande :
    ```bash
    node CaporalCli.js search <directory/file> <string à chercher>
    ```
    Exemple d'utilisation : 
    ```bash
    node CaporalCli.js search SujetB_data "Verb patterns"
    ````
- **qualiteExamen** : retourne si un examen est valide ou non 
    ```bash
    node CaporalCli qualiteExamen <file>
    ```
    Exemple d'utilisation  
    ```bash
    node CaporalCli qualiteExamen TEST.gift
    ```
- **créer gift** : permet de créet un fichier gift en sélecctionnant des questions à ajouter
    ```bash
    node CaporalCli createGift <file> <name>
    ```
    Exemple d'utilisation
    ```bash
    node CaporalCli createGift SujetB_data/U7-p77-It is,there is.gift "nouveau fichier gift"
- **createVcard** : permet de créer la Vcard d'un enseignant.
    ```bash
    node CaporalCLi <file>
    ```
    Exemple d'utilisation : 
    ```bash
    node CaporalCLi createVcard
    ````
- **examChat** : permet de dresser une graphique de l'exmaen
    ```bash
    node CaporalCli examChat <file>
    ```
    Exemple d'utilisation
    ```bash
    node CaporalCli examChat TEST.gift
    ````