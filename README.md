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
- **equal** : commande : 
    ```bash
    node CaporalCli.js compareQuestions <titre1> <sentence1> <titre2> <sentence2>
    ```  
    Exemple d'utilisation : 
    ```bash
    node CaporalCli.js compareQuestions "titre1" "ceci est la premiere question" "titre1" "ceci est la premiere question"
    ```
