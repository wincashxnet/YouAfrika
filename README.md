# YouAfrika — application (Expo / React Native)

Un seul code pour **Android**, **iPhone** et le **site web**. Même base Supabase, mêmes fonctions serveur (`pvit`, `product-reader`…) que le site actuel : rien à migrer côté données.

## Ce qui est dans cette version (6.0)

**Découvrir et apprendre**
| Écran | Adresse | Points clés |
|---|---|---|
| Accueil | `/` | héros, intentions par matière, En direct, Reprendre, Pour vous, Professeurs, En ce moment ; **suit la composition de l'équipe** (ordre, titres, rangées personnalisées, rangées masquées) |
| Vidéo | `/v/[id]` | **comme sur YouTube** : lecture automatique, montage du créateur respecté (début, fin, passages retirés), titre et « …plus » (description, chiffres, chapitres cliquables), S'abonner → Abonné + **cloche** (Toutes / Personnalisées / Aucune / Se désabonner), barre d'actions, aperçu des commentaires (fil en plein écran), « À suivre » avec **lecture automatique** (compte à rebours, annulable), mot de fin, notions et rangées « pourquoi » |
| Explorer | `/explorer` | **recherche complète** : notions, vidéos classées par EduRank, « Sur la même notion », séries, professeurs, ressources, « Vous cherchez peut-être », recherches associées, récentes et fréquentes |
| Notion | `/notion/[id]` | fil matière › thème, vidéos, « Pour s'entraîner », « Ils expliquent cette notion », notions voisines |
| Direct | `/direct/[id]` | direct en cours (lecteur natif HLS), programmé (démarre seul), terminé (replay) |
| Professeur, Abonnements, Notifications, Boutique | `/chaine/[cle]`, `/abonnements`, `/notifications`, `/boutique` | boutique : types, le plus demandé, professeurs suivis, « Voir plus » |

**Mesure** : mêmes événements que le site (ouverture, clic avec rangée et rang, lecture, pause, paliers 25-97 %, fin, recherche). Une vue n'est comptée qu'après 30 s regardées (ou la moitié d'une vidéo courte), comme sur le site.

**Acheter**
| Écran | Adresse | Points clés |
|---|---|---|
| Fiche produit | `/produit/[slug]` | **vitrine** en grand (documents : le livre du prototype HTML, identique ; vidéos : la vitrine choisie par le créateur) ; aperçu réel, contenu, auteur, barre d'achat qui dit l'état |
| Achat | `/achat/[slug]` | Airtel Money, Moov Money, carte : commande créée → demande envoyée → paiement confirmé → ressource accessible |
| Bibliothèque, Liseuse | `/bibliotheque`, `/lecture/[id]` | achats, paiements en attente, Ma liste ; **liseuse** : pages en plein écran qu'on tourne d'un glissement, commandes masquables, zoom, ambiance Jour / Sépia / Nuit, marque-pages, « aller à la page », reprise automatique |
| Achat réussi | `/achat-reussi/[commande]` | le produit flotte dans la lumière cyan, reçu (quoi, à qui, combien, comment, quand), « Ouvrir maintenant » |
| Nouvelle vente | `/vente/[ligne]` | ouverte par la notification « tchin-tchin » : gain qui monte, produit flottant, acheteur (prénom + initiale) et lieu, prix → commission → gain, total du jour, « Retirer mes revenus » |

**Compte** : connexion, inscription, mot de passe oublié, « Qu'est-ce qui vous intéresse ? », profil (photo, nom, téléphone, niveau, matières, notifications, mot de passe).

**Studio** (`/studio`) : porte-monnaie avec **« Retirer » en un geste**, mes vidéos avec leur état exact (dont « en préparation » chez Cloudflare Stream), **publier en 5 étapes** (vidéo filmée ou importée — plus de liens YouTube —, montage : couper début / fin / un passage, annuler, chapitres, couverture tirée de la vidéo ou importée, public tout le monde / abonnés, série, mot de fin, maintenant / programmée / brouillon), modifier une vidéo (infos, miniature **avec titre posé dessus**, **série et numéro d’épisode**, montage, chapitres, sous-titres, **cartes pédagogiques** — définition, formule, quiz, proposées aussi par l’assistant — mot de fin, programmation, ressources liées), **vitrine des produits** (5 scènes de livre, 4 scènes de vidéo, image derrière ou devant le titre, 6 couleurs), commentaires reçus, boutique (produits, ventes, mise en vente), retraits Mobile Money, **aide** (écrire à l'équipe, suivre ses demandes #EA, répondre), création de chaîne.

**Administration** (`/admin`, comptes admin) : vue générale, modération, vidéos (+ fiche), membres (+ fiche, notifier, suspendre), boutique (confirmer un paiement reçu, rembourser, suspendre un produit, paiements tentés PVit), **réglages de la boutique** (commissions, appareils, pages par heure, vente de vidéos), **retraits automatiques** (ouvrir, limites, délai, frais, solde myPVit, derniers retraits), **accueil** (vidéos à la une, ordre, visibilité, titres et publics des rangées), **aide aux créateurs** (file, réponses, statut), finances, annonces, journal.

**Notifications sur le téléphone** : canal « Ventes » avec le son tchin-tchin, toucher une notification ouvre l'écran qu'elle annonce ; cloche avec pastille en haut de l'accueil et de « Vous ». Il faut une application installée (build EAS lié à un projet : `eas init`) ; Expo Go ne reçoit plus les notifications à distance sur Android.

**Studio · tourner** (`/studio/enregistrer`) : caméra plein écran sur téléphone **et** dans le navigateur, compte à rebours, **téléprompteur** (texte gardé sur l'appareil, 3 vitesses, 3 tailles), relecture, puis ouverture directe du montage et de la publication avec la prise chargée. Avant cette version, « Me filmer » n'existait pas sur le web.

**Encore sur le site** (liens ↗ dans l'application) : envoi du PDF d'un produit (découpé page par page dans le navigateur) ; lancer un direct, et regarder un direct lancé depuis un téléphone (WebRTC) ; nouvelles rangées d'accueil à règles automatiques, EduRank, catégories, validation des créateurs ; clés PVit.

## Format des vidéos et public (7.13)
- **Format unique : celui de YouTube** — horizontal 16:9, idéal 1920 × 1080 px, minimum 1280 × 720 px, miniature 1280 × 720 px (`src/lib/videoFormat.ts`). Rappelé dans « Créer une vidéo », « Nouvelle vidéo » et l'édition d'une vidéo (`src/ui/FormatGuide.tsx`).
- Import : une vidéo verticale, carrée ou hors 16:9 (tolérance 1,70 à 1,85) est refusée avec un message qui explique quoi faire. Enregistreur : sur téléphone, il faut tourner l'écran à l'horizontale pour démarrer.
- **Public « Abonnés »** réglable dans « Modifier la vidéo » (Tout le monde / Mes abonnés seulement). Pour une vidéo Stream, la lecture avec jeton suit le choix.
- Notifications web : badge monochrome (`public/icons/badge-96.png`), cache du service worker renouvelé (`youafrika-v3`). Si une ancienne installation affiche encore l'ancien logo, désinstaller puis réinstaller l'application depuis le navigateur.

## Accueil, Vous, connexion et Studio (7.14)
- **Accueil** : on actualise uniquement par le geste « tirer vers le bas » (plus de bouton dans la barre du haut) ; le fil se recharge et remonte en haut. Sur le web (téléphone), le geste est géré par `src/lib/webPull.web.ts` car le `RefreshControl` n'y fonctionne pas ; à la souris, il suffit de recharger la page.
  - **Actualisation fluide** : le geste suit le doigt avec une résistance élastique (sur le web, aucune relance du rendu à chaque pixel, vibration au seuil, retour en ressort) ; l'ancien contenu reste affiché, s'estompe, puis le nouveau se pose en douceur. Un échec réseau ne vide jamais l'écran et ne bloque pas le geste suivant.
  - **Ordre différent à chaque actualisation, selon les goûts** : le serveur classe (EduRank), l'application tire un ordre pondéré par ce classement (`lib/feedShuffle.ts`) ; les vidéos du premier écran précédent descendent, jamais deux fois la même chaîne à la suite, les matières des vidéos regardées passent plus souvent devant. Les rangées « En ce moment » et « Professeurs » sont aussi retirées au sort.
- **Vous** : « Téléchargements » est maintenant une rangée de l'onglet Vous (avec le nombre de vidéos disponibles 48 h) ; il n'est plus dans Profil.
- **Connexion** : deux cartes courtes sous le formulaire — « Apprenez, où que vous soyez » et « Enseignez et gagnez » (`src/ui/Opportunity.tsx`).
- **Studio** : carte « Bâtissez votre empire numérique » avec le prochain palier de revenus (10 k, 50 k, 100 k, 500 k, 1 M, 5 M, 10 M FCFA) et nouvel onglet **Statistiques** (`/studio/statistiques`) : graphique par jour (vues, revenus, abonnés) sur 7, 28 ou 90 jours, vidéos les plus vues, boutique, audience. Les chiffres viennent de la fonction `studio_analytics` déjà présente dans la base : aucune migration.

## Directs du Studio (7.15)
- Nouvel onglet **Directs** (`/studio/directs`) : directs à venir / en cours / terminés (replay), supprimer, « Lancer sur le site ».
- **Planifier un direct** (`/studio/direct-nouveau`, aussi dans « Créer ») : titre, matière, niveau, date et heure ou « dès que je suis prêt », tout le monde / abonnés, téléphone ou OBS, replay. Utilise `createLive` (table `live_streams`, migration 41) : aucune migration.
- **Salle de direct** (`/studio/direct/[id]`) : sur le web (navigateur du téléphone), caméra + micro envoyés en WebRTC (WHIP) vers Cloudflare Stream — aperçu, couper micro / caméra, changer de caméra, « Passer en direct », « Terminer ». Application installée ou mode « logiciel » : adresse RTMPS + clé à coller dans OBS / Larix, puis « Démarrer le direct ». Fonction serveur : `stream` (déjà déployée : `live_create`, `live_credentials`, `live_start`, `live_end` ; secrets `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN`).
- **Page chaîne au style de l'application YouTube** (`src/app/chaine/[key].tsx`, thème `src/ui/yt.ts`) : couleurs, tailles et espacements relevés au pixel sur des captures (fond #0F0F0F, texte #F1F1F1, secondaire #AAAAAA, puces et boutons #272727, liens #3EA6FF, progression #FF0033) et police **Roboto** (nouvelle dépendance `@expo-google-fonts/roboto` : lancer `npm install`). Barre du haut (retour, recherche dans la chaîne, partage), bannière arrondie, avatar 72, nom 24 gras, @identifiant, « abonnés • vidéos », présentation sur 2 lignes « …plus », « lien et N autres liens », ligne verte « Dès X FCFA » (réglage de dons), S'abonner et Soutenir côte à côte (option `yt` de `SubscribeButton`). Onglets Accueil, Vidéos, En direct, Ressources ; puces : tri en liste déroulante et une puce par matière ; liste image à gauche avec progression. « …plus » et les liens ouvrent la page **À propos** (Description, Liens, Plus d'infos). Aucune migration.
- **Écran du direct plus vivant** (`src/app/direct/[id].tsx`) : compte à rebours « commence dans 2 h 15 » et date complète pour un direct programmé, miniature en fond, durée écoulée sur le badge « EN DIRECT », durée affichée une fois terminé, bouton « Réessayer » quand le flux ne charge pas, et « S'abonner » directement sur l'écran d'un direct réservé aux abonnés (le direct se charge dès l'abonnement). Aucune migration.
- **Discussion** (migration `61_direct_discussion.sql`) : messages et questions en temps réel pendant le direct, message épinglé, retrait ; réservée à ceux qui ont le droit de voir le direct, un message toutes les 2 s. Le créateur anime la discussion depuis la salle de direct.
- **Notification « X est en direct »** : envoyée par `stream` au démarrage (type `live`, via `live_notify_start`) ; la migration `63` l'envoie aussi sur les téléphones. Toucher la notification ouvre `/direct/[id]`.
- Pas encore : caméra du téléphone dans l'application installée (demande un module natif WebRTC).

## Conversations vivantes et partage (7.22)
- **Commentaires et discussion du direct** : zone d'écriture commune `src/ui/ChatComposer.tsx` (halo quand on écrit, bouton d'envoi qui s'allume, compteur près de la limite), **emojis** (`src/ui/emoji.tsx` : six réactions rapides au-dessus du clavier, clavier d'emojis intégré par thèmes avec « Récents », insertion à la position du curseur), pluie d'emojis à chaque publication, états vides qui flottent avec des débuts de phrase à toucher, emojis seuls affichés en grand, bulles qui apparaissent en douceur. Direct : réactions envoyées d'un geste, questions mises en avant (jaune), professeur repéré, nombre de messages. Tout s'immobilise si on réduit les animations.
- **Liens courts** : `…/s/Ab3xK9` au lieu de `…/v/<identifiant de 36 signes>`. Migration `67_liens_courts.sql` (table `short_links`, fonctions `short_link_make` / `short_link_resolve`), écran `src/app/s/[code].tsx`, aide `src/lib/share.ts`. Si le lien court n'est pas disponible, le lien complet est partagé. Domaine : `EXPO_PUBLIC_SHORT_URL` (par défaut le site) — pour un domaine plus court, le pointer vers le même site Netlify.
- **Partage aux couleurs de YouAfrika** : message avec accroche, titre, professeur, lien et signature, depuis la vidéo, le menu ⋯, les téléchargements, le direct et l'invitation du profil.
- **Aperçu dans WhatsApp, Telegram, iMessage…** : `netlify/edge-functions/preview.ts` répond aux robots d'aperçu avec le titre, le professeur et la miniature du contenu ; les personnes reçoivent l'application comme avant.

## Page vidéo façon YouTube (7.23)
- **Barre d'actions sur une seule ligne** (`ActionBar` dans `src/app/v/[id].tsx`) : à gauche la chaîne et « S'abonner », à droite des **icônes seules** — pouce en haut (J'aime), pouce en bas, partager, enregistrer, ⋯. Le nom de la chaîne, les abonnés, les « J'aime », les vues et la date passent dans la ligne d'infos sous le titre. Si la place manque (« Abonné » est plus large), les icônes passent à la ligne au lieu d'être coupées.
- **Pouce vers le bas** : signal privé (jamais affiché), gardé dans `user_feedback` sous le type `not_interested` (`isDisliked` / `setDisliked` dans `src/lib/videoApi.ts`) ; EduRank le lit déjà pour montrer moins de vidéos de ce genre. Un pouce en haut retire le pouce en bas et inversement. **Aucune migration.**
- **Menu ⋯** (`VideoMenu` en mode `compact`) : Télécharger en premier, puis Ressources du professeur et Signaler. Le bouton « Télécharger » n'est plus dans la barre.
- **Écran de fin en petites vignettes** (`src/ui/EndScreen.tsx`) : la vidéo reste visible (simplement assombrie) ; les vignettes font au plus 30 % de la largeur. Une vignette au centre ; deux : une de chaque côté ; trois ou quatre : en colonnes sur les côtés. Compte à rebours, « Revoir » et « Annuler » inchangés.

## Signature
- Palette du logo : nuit bleue + dégradé bleu électrique → cyan (`src/ui/theme.ts`), polices Sora + Plus Jakarta Sans.
- Tout ce qui se touche passe par `Tap` (`src/ui/kit.tsx`) : léger enfoncement, vibration discrète sur les actions qui comptent.
- **Identité sonore** : quatre sons originaux (Welcome Bell, Spark, Pulse, Connect), réglables dans Profil › Sons — voir `src/ui/sound/LISEZ-MOI.md`.
- **Réduction des animations respectée** : `useCalm()` lit le réglage du téléphone (ou du navigateur) ; squelettes immobiles, aucune apparition animée.
- Aucun état ne dépend seulement de la couleur : chaque bascule change aussi son texte (« Suivre » → « Suivi ✓ »), chaque confirmation est écrite et annoncée aux lecteurs d'écran.

## Lancer
```bash
npm install
npx expo start          # puis « a » (Android), « i » (iPhone) ou « w » (web) ; ou scanner le QR code avec Expo Go
npm run typecheck
```

## Construire
```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview      # APK à installer directement
npx eas-cli@latest build -p android --profile production   # pour Google Play
npm run build:web                                           # site statique dans dist/ (Netlify : _redirects inclus)
```

## À vérifier avant la publication sur les boutiques
Google Play et l'App Store imposent en général leur propre système de paiement pour la vente de contenus numériques. Vérifier les règles applicables au Gabon avant de publier l'achat par Mobile Money **dans** l'application ; à défaut, l'achat se fait sur le site et l'application ouvre ce qui a été acheté.

## Sécurité
Seules l'URL Supabase et la clé **publishable** sont dans l'application (`src/lib/env.ts`, surchargeables par `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Les clés PVit et autres restent dans les secrets des fonctions serveur. L'application ne marque jamais une commande comme payée et ne voit aucune donnée de carte.

## Connexion avec Google (à activer une fois côté Supabase)
1. Google Cloud Console → Identifiants → « ID client OAuth » de type Web ; adresse de redirection autorisée : `https://uhuozemjoeyzlwrgifgj.supabase.co/auth/v1/callback`.
2. Supabase → Authentication → Providers → Google : activer, coller l'ID client et le secret.
3. **Application téléphone (100 % native, sans navigateur)** : dans Google Cloud, créer aussi un ID client **Android** (nom de package `app.youafrika` + empreinte SHA-1 de la clé de signature EAS : `npx eas-cli credentials`, et celle de Google Play App Signing une fois l'app publiée) et, pour iPhone, un ID client **iOS**. Puis :
   - `npx expo install @react-native-google-signin/google-signin`
   - variable `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = l'ID client **Web** (même que celui collé dans Supabase) ; iPhone : `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - recompiler l'application (`eas build`) : ne marche pas dans Expo Go. Dans Supabase → Providers → Google, ajouter l'ID client Android (et iOS) dans « Authorized Client IDs ».
4. Supabase → Authentication → URL Configuration (utile pour le site web seulement) : ajouter aux « Redirect URLs » `https://eduafriquee.netlify.app/**` et `youafrika://**` (puis, pour les tests Expo Go, l'adresse `exp://…` affichée par `expo start`).

## Liens de partage natifs (ouvrent l'application, pas le site)
Un lien de partage est une adresse https (`https://<domaine>/s/Ab3xK9`). Deux mécanismes en font un lien **natif** :
- **Application installée** : Android « App Links » / iOS « Universal Links » (déclarés dans `app.config.js`). Toucher le lien dans WhatsApp, SMS, Gmail… ouvre directement YouAfrika, sans navigateur. Le lien court est résolu **dans l'application** (`src/app/s/[code].tsx`), sans passer par le site.
- **Application absente** : le petit site `links-site/` (indépendant du site de l'application) affiche une page YouAfrika avec « Ouvrir dans l'application », « Télécharger » et « Continuer sur le site », et fournit l'aperçu (image, titre) dans WhatsApp / Telegram / Facebook.
Dans l'application, toute adresse YouAfrika (descriptions, commentaires, liens de chaîne) s'ouvre aussi dans l'application (`src/lib/openLink.ts`).

**Mise en place (une fois) :**
1. Créer un second site Netlify depuis le dossier `links-site/` (idéalement un domaine à vous, ex. `liens.youafrika.com`) ; renseigner `EXPO_PUBLIC_SHORT_URL=https://liens.youafrika.com` pour l'application, et la variable `FILES_URL` comme sur le site principal si les images sont sur R2.
2. Dans `links-site/.well-known/assetlinks.json`, remplacer les deux empreintes par le SHA-256 de la clé de signature EAS (`npx eas-cli credentials`) et celui de Google Play App Signing (Play Console → Intégrité de l'application). Dans `apple-app-site-association`, remplacer `REMPLACER_TEAM_ID` par l'identifiant d'équipe Apple.
3. Dans `links-site/index.html`, renseigner `PLAY` (et `APPSTORE`) avec les vraies fiches des boutiques.
4. Refaire un `eas build` (les filtres d'intention sont dans l'application compilée), puis vérifier : `https://<domaine>/.well-known/assetlinks.json` doit s'afficher dans un navigateur.
Les anciens liens `eduafriquee.netlify.app/...` ouvrent aussi l'application si ce site sert son propre `assetlinks.json` (copier le fichier dans `public/.well-known/`).

## Autorisations et application installable (PWA)
- **Autorisations** (`/autorisations`) : à la première arrivée de chaque personne sur un appareil (après « Qu'est-ce qui vous intéresse ? »), l'application demande notifications, caméra et micro, avec la raison de chacune. Rouvrable depuis Profil → Autorisations. Chaque demande part d'un toucher (exigé par les navigateurs) ; une autorisation refusée affiche comment la rétablir.
- **PWA** : `public/manifest.webmanifest`, `public/sw.js` (service worker : fichiers gardés sur l'appareil, page « hors connexion », notifications push), icônes dans `public/icons/`, `public/index.html` (balises d'installation). Android et ordinateur : bouton « Installer » (bandeau + Profil). iPhone : Partager → Sur l'écran d'accueil (les notifications web n'y fonctionnent qu'une fois l'application installée).
- **Notifications web** : le navigateur s'inscrit par `push_public_key` / `push_subscribe` ; la fonction serveur `push` (à déployer sans vérification JWT) envoie les notifications.
- Le site doit être servi en **HTTPS** (Netlify le fait) ; `netlify.toml` règle le cache du service worker et les droits caméra/micro.

## Assistant IA de création
Boutons « ✨ » dans le Studio (réservés aux créateurs avec une chaîne active) :
- Publier / modifier une vidéo : titre, description, mots-clés suggérés ; couverture générée par l'IA.
- Enregistrer : texte du téléprompteur écrit à partir d'un sujet et d'une durée.
- Produits : description suggérée ; couverture générée pour les produits vidéo.
- Commentaires : réponse suggérée (modifiable avant l'envoi).
Quotas par jour : 40 textes, 12 images (×5 pour les administrateurs). Chaque suggestion se corrige ou s'annule.
Serveur : fonction `ai` (Supabase). Secrets requis : `GROQ_API_KEY`, `CF_ACCOUNT_ID`, `CF_AI_TOKEN` (facultatifs : `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`).
Limite : l'IA crée de nouvelles images ; elle ne retouche pas une photo existante.

## Présentation de la chaîne (onglet « À propos »)
- Écran `/studio/presentation` (Studio › « Présentation de la chaîne », ou bouton « Écrire ma présentation » sur sa propre page quand elle est vide) : 500 caractères au plus, enregistré dans `profiles.bio`.
- Bouton « Écrire avec l'assistant » : tâche `bio` de la fonction serveur `ai` (version 6 ou plus), à partir de quelques mots du professeur ; la proposition se relit avant d'enregistrer.
- Migration `60_presentation_chaine.sql` : contrainte de 500 caractères sur `profiles.bio`.

## Aperçu automatique dans le fil
- **Arrêt sur une vidéo** : quand la personne s'arrête ~2,5 s sur une carte (accueil, abonnements), la vidéo joue sans le son, directement dans la carte. Un trait fin en bas montre l'avancement ; la miniature fond vers la vidéo (jamais d'écran noir).
- **Un seul aperçu à la fois** : la carte qui domine la zone de lecture, immobile et visible aux trois quarts, joue ; elle continue tant qu'elle reste à moitié visible, une autre carte immobile la remplace. Un aperçu terminé ne rejoue pas.
- **Toucher la carte** ouvre la vidéo, qui démarre aussitôt (sans second geste). L'aperçu s'arrête dès qu'on quitte l'écran.
- **Respect de la personne** : aucun aperçu avec « Économiser les données », « Réduire les animations », un lecteur d'écran, ou application en arrière-plan. Le son des autres applications n'est pas coupé.
- Code : `src/lib/feedPreview.ts` (choix de la carte, délai `DWELL_MS`), `src/ui/FeedPreview.tsx` (lecture), prop `preview` de `FeedCard` pour l'activer sur un autre écran.
- **Démarrage de la vidéo ouverte** : relance automatique si la lecture n'a pas pris ; sur navigateur (son refusé sans geste) et pour YouTube, relance sans le son.


## Dons aux professeurs (branchés sur la plateforme)
**Qui voit quoi.** Le donateur voit le don, les frais de l'opérateur (à sa charge) et le total : rien d'autre. La commission de YouAfrika (10 %) n'existe que pour le professeur (guide « Mes revenus », notification de don, ses revenus) et pour l'administration. Elle n'apparaît nulle part côté donateur : ni à l'écran, ni dans les réglages publics, ni dans sa commande, ni dans le code de la feuille de don (un test le vérifie).

**Comment ça marche.**
- Un don est une commande (`digital_orders.kind = 'donation'`) qui passe par le **même circuit de paiement que les achats** (fonctions serveur `pvit` / `ikeepay`, `payment_begin`, règlement serveur). Aucune fonction serveur à redéployer.
- `supabase/migrations/73_dons.sql` : tables `donation_config` (réglages) et `donations` (fiche du don), RPC `donation_public_terms()` (réglages publics, **sans** commission) et `donation_place()` (crée la commande : professeur valide, montant dans les limites, frais et commission recalculés par la base), contrôle du moyen de paiement choisi, `store_mark_paid` qui crédite les revenus du professeur et lui envoie la notification « Nouveau don » (le donateur ne reçoit ni « achat disponible » ni reçu de vente).
- Les lignes de commande d'un don portent la vraie répartition (elles alimentent les revenus du professeur) mais sont **illisibles pour le donateur** (politique RLS) ; sa commande a `fee_percent = 0`.
- Réglages par défaut : minimum 200 FCFA, maximum 500 000 FCFA, frais Mobile Money 2 %, carte 3,5 %, commission 10 %. À modifier dans la table `donation_config` (réservée à l'administration) ; les taux de frais sont **indicatifs** : à remplacer par les tarifs réels des contrats.
- Frais arrondis au franc supérieur ; commission arrondie au franc le plus proche ; le professeur reçoit don − commission (jamais de frais d'opérateur déduits).

**Application.**
- `src/ui/Donate.tsx` : feuille « Soutenir », montant libre ou rapide, pays → Mobile Money (Gabon par PVit, autres pays par iKeePay) ou carte (page de paiement sécurisée, sans nom de prestataire), suivi de la confirmation de l'opérateur.
- Bouton ❤ dans la barre d'actions de la vidéo (`src/app/v/[id].tsx`) et bouton « Soutenir » sur la chaîne (`src/app/chaine/[key].tsx`). Masqués sur sa propre chaîne.
- `src/lib/donations.ts` (calcul affiché), `src/lib/donate.ts` (appels à la base), `src/lib/donationCountries.ts` (pays et opérateurs ouverts).
- `fetchMyOrders` ne remonte que les achats : un don n'apparaît pas dans « Mes commandes ».
- Les dons en attente depuis plus de 30 minutes sont annulés automatiquement ; 3 dons en attente au maximum par donateur.
- Maquette interactive : `youafrika-commentaires-v4.html` (livrée à côté du zip).

## Dons : circuit et suivi séparés des ventes (7.16.0)

Migration `supabase/migrations/74_dons_registre_separe.sql` (à appliquer APRÈS la 73, après l'avoir validée dans une transaction annulée) :

- **Un don n'est plus une vente** : plus aucune ligne dans `digital_order_items`. La fiche `donations` porte le don, les frais de l'opérateur, la commission et le net, le lieu (vidéo, direct, chaîne), un message et l'option « anonyme ».
- **Registre unique `earnings_ledger`** (ex-`creator_earnings`, avec `source` = `sale` ou `donation`) : un seul solde de retrait pour le créateur. `creator_earnings` devient une **vue qui ne montre que les ventes** : Studio, finances, admin et remboursements ne comptent donc jamais un don. Les fonctions de retrait (`payout_choose_amount`, `payout_summary`, `pvit_server_payout_open/settle`) lisent le registre complet.
- **Studio › Dons** (`studio_donations`, `payout_breakdown`) : net reçu, donateurs, don moyen, évolution, provenance (vidéo / direct / chaîne), meilleures vidéos et directs, derniers dons ; solde de retrait en deux lignes (ventes, dons).
- **Admin › Dons** (`admin_donations`, `admin_donation_list`, `admin_donation_config_get/save`) : suivi global, liste filtrable, et réglages éditables (ouverture, dons pendant les directs, minimum, maximum, frais Mobile Money et carte, commission), validés côté serveur et inscrits au journal. Le « dû aux créateurs » des dons est montré ici, pas dans Finances.
- **Directs** : bouton « Faire un don » et fil des dons dans la salle de direct (`live_donation_feed`, rafraîchi toutes les 8 s) ; le créateur voit le même fil et retrouve ces dons dans Studio › Dons.
- Le donateur ne lit plus la table `donations` : il passe par `donation_my_list` (don, frais, total, statut ; jamais la commission).


## Mix sur la page vidéo (parcours d'apprentissage)
Comme le « Mix » de YouTube, mais pour apprendre : un parcours composé autour de la vidéo qu'on regarde.
- **Barre repliée** sous la barre d'actions (`MixBar`) : « Mix · titre », la vidéo suivante en vignette, position (3/12). Un toucher ouvre la liste.
- **Liste ouverte** (`MixPanel`) : elle monte **sous** le lecteur, qui reste visible et continue de jouer. Numéro d'étape, « En lecture » avec égaliseur, « Ensuite », « Vu ✓ », barre de reprise, durée totale. **Boucle** et **Lecture auto** en haut. Grand écran : la liste reste affichée à droite du lecteur. Retour Android : ferme la liste.
- **Ordre** (`src/lib/mixCore.ts`) : la série de la vidéo dans l'ordre des épisodes, puis les vidéos proches d'EduRank, les vidéos déjà terminées (≥ 95 %) en dernier. 25 vidéos au plus.
- **Le parcours reste le même d'une vidéo à l'autre** (`src/lib/mix.ts`, en mémoire pour la visite) : la lecture automatique enchaîne la suite du Mix ; ouvrir une vidéo ailleurs (accueil, recherche, « À suivre ») compose un nouveau Mix. Les vidéos que le créateur a choisies pour l'écran de fin gardent la priorité.
- **Menu ⋯** : « Lire ensuite », « Lire en dernier », « Retirer du Mix » (aussi dans les cartes « À suivre »), puis Ma liste, Télécharger, Partager, Chaîne.
- « À suivre » n'affiche plus les vidéos déjà dans le Mix. Événements suivis avec la source `mix` (clic) ; la lecture automatique reste `autoplay`.
- **Aucune migration** : le Mix réutilise `related_videos` / EduRank, `videos.series_title` / `series_episode` et `video_progress`.
- Test : `tests/mix.test.mjs` (composition, ordre, boucle, lire ensuite / en dernier, retirer).


## Animations « S'abonner », courbes et sons naturels (v19)
Voir `MOTION.md` (section v19) et `src/ui/sound/LISEZ-MOI.md` (section v19). 5 nouveaux éléments Motion aux couleurs YouAfrika, courbes d'entrée / sortie naturelles (+ « Ressort »), lissage à ~30 Hz, sons `tap`, `bell-ring`, `twinkle` et variantes de Spark. Test : `tests/curves.test.mjs`. Aucune migration.

## Animations du logo dans le Motion Studio (v20)
Voir `MOTION.md` (section v20). 6 nouveaux éléments Motion tirés du logo officiel (Tracé lumineux, Remplissage, Ondes Play, Reflet et étincelle, Bandeau signature, Transition Iris), dessinés avec les fichiers de l'animation d'ouverture. Code : `src/lib/motion/logoScenes.ts`, `src/ui/LogoScenes.tsx`. Test : `tests/logoScenes.test.mjs`. Aucune migration.
