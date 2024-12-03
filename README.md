# GL02_A24_LeVentSouffle

## Structure du projet
GiftParser.js -> transforme les datas de Gift en objet `question`
questionnaire.js -> Fichier où on décrit notre objet (`POI`)
CaporalCli.js -> Fait le relais avec l'interface en invite de commande

spec -> dossier pour les tests unitairess

## TODO
[] Parser
[] Question
[] CaporalCli

## Dépendances 
- Node
- Grep

### Infos pour les développeurs :
- les **rien dans le cahier des charges**
- Les commentaires qu'est ce qu'on en fait ?

## CaporalCli.js 
### Question
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
