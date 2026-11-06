# Calendrier de l'Avent 🎄

Ce dépôt GitHub ne contient **que la coquille du calendrier, vide**. Le contenu personnel (textes, photos, quiz…) se trouve dans un **Google Sheet privé**. Il n'est envoyé qu'avec le **code secret**, et uniquement pour les cases du jour et des jours passés : c'est **Google qui vérifie la date**, pas le téléphone.

```
GitHub Pages (public)            Google Sheet + Apps Script (privé)
index.html, app.js, icônes  ──►  vérifie le code + la date (heure de Paris)
calendrier vide                  ◄── renvoie seulement les cases autorisées
```

---

## Étape 1 : Mettre la coquille sur GitHub Pages

1. Sur github.com, crée un dépôt **public**, par exemple `avent`. La version gratuite de GitHub Pages exige un dépôt public, ce qui ne pose pas de problème puisqu'il ne contient aucun contenu personnel.
2. Clique sur **Add file → Upload files** et glisse **tout le contenu du dossier**, sauf le dossier `backend` (tu peux aussi le mettre, il ne contient rien de personnel).
3. Va dans **Settings → Pages**. Dans « Source », choisis **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`, et clique sur Save.
4. Une à deux minutes plus tard, le calendrier est en ligne à l'adresse `https://TON-PSEUDO.github.io/avent/`.

## Étape 2 : Créer la partie privée (Google Sheet)

1. Sur drive.google.com, crée un **nouveau Google Sheet**, par exemple « Calendrier de l'Avent – privé ».
2. Dans le menu **Extensions**, choisis **Apps Script**. Efface le code présent et colle **tout le contenu de `backend/Code.gs`**, puis enregistre (💾).
3. Dans la liste des fonctions en haut, choisis **`installer`** et clique sur **Exécuter**.
   - Google demande des autorisations : clique sur *Examiner les autorisations*, choisis ton compte, puis *Paramètres avancés* et *Accéder au projet (non sécurisé)*. C'est normal, car c'est ton propre script. Valide ensuite.
   - Le script crée deux onglets : **Contenu**, avec 24 exemples à remplacer, et **Réglages**, avec ton **code secret** et le mode démo réglé sur OUI.
4. Clique sur **Déployer → Nouveau déploiement**. Avec la roue ⚙️, choisis **Application Web**, puis :
   - *Exécuter en tant que* : **Moi**
   - *Qui a accès* : **Tout le monde** (l'accès reste protégé par le code secret)
   - Clique sur Déployer et **copie l'URL** (elle se termine par `/exec`).
5. Sur GitHub, ouvre `app.js`, clique sur le crayon ✏️ et colle l'URL à la ligne :
   ```js
   const SCRIPT_URL = 'https://script.google.com/macros/s/……/exec';
   ```
   Clique ensuite sur **Commit changes**.

## Étape 3 : Tester (mode démo)

- Ouvre `https://TON-PSEUDO.github.io/avent/#code=TONCODE` sur **ton** téléphone. Tu peux aussi ouvrir l'adresse normale et appuyer sur 🔑 « J'ai un code ».
- Tant que **Mode démo = OUI** dans l'onglet Réglages, la barre « Démo · jour simulé » apparaît et toutes les cases sont consultables.
- Sans code, n'importe quel visiteur voit seulement un calendrier vide.

## Remplir le contenu (onglet « Contenu »)

| Type | Colonnes utiles |
|---|---|
| `mot` | Titre, Texte |
| `souvenir` | Titre, Texte, **Photo (lien Google Drive)**, Légende |
| `bon` | Titre, Texte, Validité |
| `defi` | Titre, Texte |
| `musique` | Titre, Texte, Morceau, Lien musique (Spotify, YouTube…) |
| `quiz` | Titre, Question, Choix (`A ; B ; C`), N° de la bonne réponse (1, 2 ou 3), Message |
| `recette` | Titre, Texte |

- **Photos** : mets-les dans ton Drive. **Ne les partage pas**, le script les lit lui-même. Fais un clic droit sur la photo, choisis *Partager → Copier le lien* et colle ce lien dans la colonne Photo.
- **Les modifications du tableau sont visibles tout de suite**, sans redéployer. Seule une modification du *code* `Code.gs` demande de passer par *Déployer → Gérer les déploiements → ✏️ → Nouvelle version*.

## Étape 4 : Mise en service pour ta femme

1. Dans l'onglet Réglages, passe **Mode démo** sur **NON**. Avant le 1er décembre, toutes les cases restent alors fermées, quoi qu'il arrive.
2. Si tu le souhaites, change le **code secret** pour un nouveau que tu n'as jamais utilisé en test.
3. Sur son téléphone :
   - **iPhone** : ouvre l'adresse dans **Safari**, touche Partager, puis « Sur l'écran d'accueil ». À la première ouverture depuis l'icône, l'application demande le code : saisis-le une seule fois.
   - **Android** : ouvre l'adresse avec `#code=…` dans **Chrome**, touche ⋮, puis « Ajouter à l'écran d'accueil » ou « Installer l'application ».
