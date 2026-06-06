import { createContext, createElement, useContext, useEffect, useState } from "react";

// ─── Translations ────────────────────────────────────────
export const STRINGS = {
  fr: {
    locale: "fr-FR",

    /* Landing nav */
    "landing.nav.features": "Fonctionnalités",
    "landing.nav.how": "Comment ça marche",
    "landing.nav.github": "Voir sur GitHub",
    "landing.nav.login": "Se connecter",
    "landing.nav.signup": "Créer un compte",

    /* Landing hero */
    "landing.hero.eyebrow": "Roadmap produit partagée",
    "landing.hero.title": "Votre roadmap produit, claire et partageable.",
    "landing.hero.subtitle":
      "Vista transforme vos jalons et issues GitHub en une roadmap élégante, à partager avec vos clients. Ils suivent l’avancement et déposent leurs demandes — vous gardez le contrôle.",
    "landing.hero.ctaPrimary": "Créer un compte gratuit",
    "landing.hero.ctaSecondary": "Voir sur GitHub",
    "landing.preview.caption": "Aperçu du dashboard",

    /* Landing features */
    "landing.features.eyebrow": "Ce que fait Vista",
    "landing.features.title": "Une seule vue, toute la transparence.",
    "landing.feat1.title": "Roadmap Gantt",
    "landing.feat1.body":
      "Une timeline élégante générée depuis vos issues GitHub, regroupée par jalon, avec échéances et marqueur du jour.",
    "landing.feat2.title": "Jalons & avancement",
    "landing.feat2.body":
      "Chaque grande étape avec sa progression en temps réel. Vos clients voient où en est le projet, d’un coup d’œil.",
    "landing.feat3.title": "Demandes clients",
    "landing.feat3.body":
      "Un formulaire propre pour les fonctionnalités, bugs et questions. Chaque demande devient une issue GitHub.",

    /* Landing how */
    "landing.how.eyebrow": "Comment ça marche",
    "landing.how.title": "Prêt en trois étapes.",
    "landing.how.step1.title": "Connectez votre repo",
    "landing.how.step1.body":
      "Vista lit vos jalons et issues GitHub. Rien à ressaisir, tout reste synchronisé.",
    "landing.how.step2.title": "Partagez l’accès",
    "landing.how.step2.body":
      "Invitez vos clients. Ils se connectent et accèdent à un dashboard clair, sans bruit technique.",
    "landing.how.step3.title": "Suivez & collectez",
    "landing.how.step3.body":
      "Ils suivent l’avancement et déposent leurs demandes. Vous priorisez directement sur GitHub.",

    /* Landing callout + cta */
    "landing.callout.title": "La transparence produit, sans effort.",
    "landing.callout.body":
      "Fini les exports manuels et les comptes-rendus à rallonge. Une URL, et vos clients ont toujours la dernière version.",
    "landing.callout.cta": "Commencer maintenant",
    "landing.cta.title": "Prêt à partager votre roadmap ?",
    "landing.cta.subtitle": "Créez votre compte en quelques secondes.",
    "landing.cta.button": "Créer un compte gratuit",

    /* Auth */
    "auth.back": "Retour à l’accueil",
    "auth.brand.title": "Toute votre roadmap, au même endroit.",
    "auth.brand.body":
      "Connectez-vous pour accéder au dashboard, suivre l’avancement et gérer les demandes.",
    "auth.login.title": "Bon retour",
    "auth.login.subtitle": "Connectez-vous pour accéder à la roadmap.",
    "auth.signup.title": "Créer votre compte",
    "auth.signup.subtitle": "Quelques secondes, et c’est parti.",
    "auth.name": "Nom complet",
    "auth.namePlaceholder": "Jeanne Dupont",
    "auth.email": "Email",
    "auth.emailPlaceholder": "vous@exemple.com",
    "auth.password": "Mot de passe",
    "auth.passwordPlaceholder": "••••••••",
    "auth.login.submit": "Se connecter",
    "auth.signup.submit": "Créer mon compte",
    "auth.toSignup": "Pas encore de compte ?",
    "auth.toSignupLink": "Créer un compte",
    "auth.toLogin": "Déjà un compte ?",
    "auth.toLoginLink": "Se connecter",
    "auth.required": "Ce champ est requis.",
    "auth.demoNote": "Démo : utilisez n’importe quel email et mot de passe.",

    /* Dashboard */
    "dash.hello": "Bonjour",
    "dash.project": "Projet suivi",
    "dash.newRequest": "Nouvelle demande",
    "dash.account": "Compte",
    "dash.logout": "Se déconnecter",
    "dash.completion": "Avancement global",
    "dash.tab.overview": "Avancement & jalons",
    "dash.tab.gantt": "Gantt complet",
    "dash.overview.title": "Les jalons",
    "dash.overview.subtitle": "Les grandes étapes du projet et leur progression.",

    /* Stats */
    "stats.complete": "Terminé",
    "stats.milestones": "Jalons",
    "stats.open": "En cours",
    "stats.closed": "Livrées",
    "stats.tasks": "demandes",

    /* Roadmap */
    "roadmap.eyebrow": "Calendrier",
    "roadmap.title": "La roadmap, dans le temps",
    "roadmap.subtitle":
      "Chaque barre est une issue GitHub, regroupée par jalon. Cliquez une barre pour ouvrir l’issue.",
    "roadmap.all": "Toutes",
    "roadmap.open": "En cours",
    "roadmap.closed": "Livrées",
    "roadmap.today": "Aujourd’hui",
    "roadmap.deadline": "Échéance",
    "roadmap.openLabel": "En cours",
    "roadmap.closedLabel": "Livrée",
    "roadmap.clickHint": "Cliquez une barre pour ouvrir l’issue",
    "roadmap.empty": "Aucune issue à afficher pour ce filtre.",
    "roadmap.zoomMonth": "Mois",
    "roadmap.zoomWeek": "Semaines",
    "roadmap.zoomDay": "Jours",
    "roadmap.expandAll": "Tout déplier",
    "roadmap.collapseAll": "Tout replier",
    "roadmap.search": "Rechercher une issue…",
    "roadmap.noResults": "Aucun résultat",
    "roadmap.late": "En retard",
    "roadmap.by": "par",
    "roadmap.sortMs": "Jalons",
    "roadmap.sortIssues": "Issues",
    "roadmap.sortDefault": "Ordre par défaut",
    "roadmap.sortDue": "Par échéance",
    "roadmap.sortName": "Par nom",
    "roadmap.sortProgress": "Par avancement",
    "roadmap.sortChrono": "Chronologie",
    "roadmap.sortStatus": "Par statut",
    "roadmap.sortNumber": "Par numéro",

    /* Milestones */
    "milestones.due": "Échéance",
    "milestones.noDue": "Pas de date",
    "milestones.tasks": "demandes",
    "milestones.view": "Voir les issues",
    "mt.milestone": "Jalon",
    "mt.progress": "Progression",
    "mt.requests": "Demandes",
    "mt.due": "Échéance",

    /* Issue form */
    "form.title": "Proposer une demande",
    "form.subtitle": "Décrivez votre besoin. Nous le recevrons directement.",
    "form.typeLabel": "Type de demande",
    "form.typeFeature": "Fonctionnalité",
    "form.typeBug": "Bug",
    "form.typeQuestion": "Question",
    "form.typeOther": "Autre",
    "form.titleLabel": "Titre",
    "form.titlePlaceholder": "Résumez en une phrase",
    "form.descLabel": "Description",
    "form.descPlaceholder":
      "Donnez le contexte, ce que vous attendez, et comment reproduire le cas échéant.",
    "form.nameLabel": "Votre nom",
    "form.namePlaceholder": "Optionnel",
    "form.emailLabel": "Email",
    "form.emailPlaceholder": "Optionnel — pour un suivi",
    "form.optional": "optionnel",
    "form.submit": "Envoyer la demande",
    "form.submitting": "Envoi…",
    "form.required": "Ce champ est requis.",
    "form.successTitle": "Demande envoyée",
    "form.successMsg": "Merci ! Votre demande a bien été créée.",
    "form.viewIssue": "Voir la demande",
    "form.another": "Envoyer une autre demande",
    "form.errorTitle": "Échec de l’envoi",
    "form.errorGeneric": "Impossible d’envoyer la demande. Réessayez dans un instant.",
    "form.errorNotConfigured":
      "L’envoi de demandes n’est pas encore activé sur ce déploiement.",
    "form.close": "Fermer",

    /* CTA + footer */
    "cta.title": "Une idée, un bug, une question ?",
    "cta.subtitle": "Proposez votre demande en quelques secondes.",
    "cta.button": "Nouvelle demande",
    "footer.tagline": "Une roadmap partagée, propulsée par GitHub.",
    "footer.source": "Code source",

    /* States */
    "state.loading": "Chargement de la roadmap…",
    "state.errorTitle": "Impossible de charger la roadmap",
    "state.errorHint": "Vérifiez le dépôt configuré",
    "state.empty": "Aucun jalon avec des issues pour le moment.",

    /* Common */
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "common.delete": "Supprimer",
    "common.back": "Retour",
    "common.loading": "Chargement…",

    /* Sidebar */
    "side.overview": "Vue d’ensemble",
    "side.admin": "Administration",
    "side.projects": "Projets",
    "side.newProject": "Nouveau projet",
    "side.account": "Compte",
    "side.logout": "Se déconnecter",
    "side.mockBadge": "Backend simulé",

    /* Workspace */
    "ws.title": "Vos projets",
    "ws.subtitle": "Les projets que vous gérez ou que l’on partage avec vous.",
    "ws.owned": "Gérés par vous",
    "ws.joined": "Partagés avec vous",
    "ws.empty": "Aucun projet pour l’instant.",
    "ws.createFirst": "Créer votre premier projet",
    "ws.open": "Ouvrir",
    "ws.manage": "Gérer",
    "ws.members": "membres",
    "ws.pending": "en attente",

    /* Status */
    "status.available": "Disponible sur Vista",
    "status.unavailable": "Masqué",
    "status.shared": "Partagé",
    "status.private": "Privé",

    /* Roles */
    "role.owner": "Propriétaire",
    "role.editor": "Éditeur",
    "role.viewer": "Lecteur",

    /* Admin */
    "admin.title": "Administration",
    "admin.subtitle": "Choisissez les projets disponibles sur Vista et ceux à partager.",
    "admin.stat.projects": "Projets",
    "admin.stat.available": "Disponibles",
    "admin.stat.shared": "Partagés",
    "admin.stat.pending": "Demandes en attente",
    "admin.col.project": "Projet",
    "admin.col.visibility": "Visibilité",
    "admin.col.available": "Disponible",
    "admin.col.members": "Membres",
    "admin.col.requests": "Demandes",
    "admin.col.manage": "Gérer",
    "admin.empty": "Aucun projet. Créez-en un pour commencer.",

    /* New project */
    "np.title": "Nouveau projet",
    "np.subtitle": "Créez un espace de roadmap à partager.",
    "np.name": "Nom du projet",
    "np.namePh": "Refonte du site, App mobile…",
    "np.desc": "Description",
    "np.descPh": "À quoi sert ce projet ?",
    "np.source": "Source des données",
    "np.sourceMock": "Démo",
    "np.sourceMockHint": "Roadmap d’exemple, parfait pour tester.",
    "np.sourceGithub": "GitHub",
    "np.sourceGithubHint": "Lit vos jalons & issues.",
    "np.repo": "Dépôt (owner/repo)",
    "np.repoPh": "octocat/Hello-World",
    "np.visibility": "Visibilité",
    "np.visPrivate": "Privé",
    "np.visShared": "Partagé (via lien)",
    "np.available": "Disponible sur Vista dès la création",
    "np.create": "Créer le projet",
    "np.creating": "Création…",

    /* Project settings */
    "ps.back": "Tous les projets",
    "ps.tab.general": "Général",
    "ps.tab.members": "Membres",
    "ps.tab.requests": "Demandes d’accès",
    "ps.tab.invite": "Inviter",
    "ps.gen.title": "Paramètres",
    "ps.gen.name": "Nom du projet",
    "ps.gen.desc": "Description",
    "ps.gen.visibility": "Visibilité",
    "ps.gen.visPrivate": "Privé — sur invitation uniquement",
    "ps.gen.visShared": "Partagé — accessible via un lien d’invitation",
    "ps.gen.available": "Disponible sur Vista",
    "ps.gen.availableHint": "Si désactivé, le projet est masqué de la plateforme et des liens.",
    "ps.gen.save": "Enregistrer les modifications",
    "ps.gen.saved": "Enregistré",
    "ps.danger": "Zone de danger",
    "ps.dangerHint": "La suppression est définitive et ne peut pas être annulée.",
    "ps.delete": "Supprimer le projet",
    "ps.deleteConfirm": "Supprimer définitivement ce projet ?",
    "ps.mem.title": "Membres actifs",
    "ps.mem.empty": "Aucun membre actif.",
    "ps.mem.you": "Vous",
    "ps.mem.remove": "Retirer",
    "ps.req.title": "Demandes en attente",
    "ps.req.empty": "Aucune demande en attente.",
    "ps.req.requested": "a demandé l’accès",
    "ps.req.approve": "Approuver",
    "ps.req.deny": "Refuser",
    "ps.req.role": "Rôle attribué",
    "ps.inv.title": "Lien d’invitation",
    "ps.inv.desc": "Partagez ce lien pour qu’un client puisse demander l’accès.",
    "ps.inv.copy": "Copier le lien",
    "ps.inv.copied": "Copié",
    "ps.inv.rotate": "Régénérer",
    "ps.inv.disabledHint": "Activez le partage (Général) pour générer un lien.",

    /* Project dashboard */
    "pd.back": "Projets",
    "pd.manage": "Gérer le projet",
    "pd.viewerNote": "Vous consultez ce projet en lecture seule.",

    /* Join via link */
    "join.invitedTo": "Vous êtes invité à suivre",
    "join.intro": "Demandez l’accès pour suivre l’avancement de ce projet.",
    "join.request": "Demander l’accès",
    "join.requesting": "Envoi…",
    "join.requested": "Demande envoyée",
    "join.requestedMsg": "Le propriétaire doit approuver votre accès. Revenez plus tard.",
    "join.member": "Vous avez déjà accès",
    "join.memberMsg": "Vous êtes membre de ce projet.",
    "join.open": "Ouvrir le projet",
    "join.pending": "Demande en attente",
    "join.pendingMsg": "Votre demande est en cours d’examen par le propriétaire.",
    "join.invalid": "Lien invalide",
    "join.invalidMsg": "Ce lien d’invitation est invalide, expiré ou le projet n’est plus partagé.",
    "join.home": "Retour à l’accueil",
  },

  en: {
    locale: "en-US",

    "landing.nav.features": "Features",
    "landing.nav.how": "How it works",
    "landing.nav.github": "View on GitHub",
    "landing.nav.login": "Log in",
    "landing.nav.signup": "Sign up",

    "landing.hero.eyebrow": "Shared product roadmap",
    "landing.hero.title": "Your product roadmap, clear and shareable.",
    "landing.hero.subtitle":
      "Vista turns your GitHub milestones and issues into an elegant roadmap to share with clients. They follow progress and submit requests — you stay in control.",
    "landing.hero.ctaPrimary": "Create a free account",
    "landing.hero.ctaSecondary": "View on GitHub",
    "landing.preview.caption": "Dashboard preview",

    "landing.features.eyebrow": "What Vista does",
    "landing.features.title": "One view, total transparency.",
    "landing.feat1.title": "Gantt roadmap",
    "landing.feat1.body":
      "An elegant timeline generated from your GitHub issues, grouped by milestone, with deadlines and a today marker.",
    "landing.feat2.title": "Milestones & progress",
    "landing.feat2.body":
      "Every major stage with live progress. Your clients see where the project stands at a glance.",
    "landing.feat3.title": "Client requests",
    "landing.feat3.body":
      "A clean form for features, bugs and questions. Every request becomes a GitHub issue.",

    "landing.how.eyebrow": "How it works",
    "landing.how.title": "Ready in three steps.",
    "landing.how.step1.title": "Connect your repo",
    "landing.how.step1.body":
      "Vista reads your GitHub milestones and issues. Nothing to re-enter, always in sync.",
    "landing.how.step2.title": "Share access",
    "landing.how.step2.body":
      "Invite your clients. They log in to a clean dashboard, free of technical noise.",
    "landing.how.step3.title": "Track & collect",
    "landing.how.step3.body":
      "They follow progress and submit requests. You prioritize straight from GitHub.",

    "landing.callout.title": "Effortless product transparency.",
    "landing.callout.body":
      "No more manual exports or endless status reports. One URL, and your clients always have the latest.",
    "landing.callout.cta": "Get started",
    "landing.cta.title": "Ready to share your roadmap?",
    "landing.cta.subtitle": "Create your account in seconds.",
    "landing.cta.button": "Create a free account",

    "auth.back": "Back to home",
    "auth.brand.title": "Your whole roadmap, in one place.",
    "auth.brand.body":
      "Log in to reach the dashboard, follow progress, and manage requests.",
    "auth.login.title": "Welcome back",
    "auth.login.subtitle": "Log in to access the roadmap.",
    "auth.signup.title": "Create your account",
    "auth.signup.subtitle": "A few seconds and you’re in.",
    "auth.name": "Full name",
    "auth.namePlaceholder": "Jane Doe",
    "auth.email": "Email",
    "auth.emailPlaceholder": "you@example.com",
    "auth.password": "Password",
    "auth.passwordPlaceholder": "••••••••",
    "auth.login.submit": "Log in",
    "auth.signup.submit": "Create account",
    "auth.toSignup": "No account yet?",
    "auth.toSignupLink": "Sign up",
    "auth.toLogin": "Already have an account?",
    "auth.toLoginLink": "Log in",
    "auth.required": "This field is required.",
    "auth.demoNote": "Demo: use any email and password.",

    "dash.hello": "Hi",
    "dash.project": "Tracking",
    "dash.newRequest": "New request",
    "dash.account": "Account",
    "dash.logout": "Log out",
    "dash.completion": "Overall progress",
    "dash.tab.overview": "Progress & milestones",
    "dash.tab.gantt": "Full Gantt",
    "dash.overview.title": "Milestones",
    "dash.overview.subtitle": "The project’s major stages and how far along they are.",

    "stats.complete": "Complete",
    "stats.milestones": "Milestones",
    "stats.open": "In progress",
    "stats.closed": "Shipped",
    "stats.tasks": "requests",

    "roadmap.eyebrow": "Timeline",
    "roadmap.title": "The roadmap, over time",
    "roadmap.subtitle":
      "Each bar is a GitHub issue, grouped by milestone. Click a bar to open the issue.",
    "roadmap.all": "All",
    "roadmap.open": "In progress",
    "roadmap.closed": "Shipped",
    "roadmap.today": "Today",
    "roadmap.deadline": "Due",
    "roadmap.openLabel": "In progress",
    "roadmap.closedLabel": "Shipped",
    "roadmap.clickHint": "Click a bar to open its issue",
    "roadmap.empty": "Nothing to show for this filter.",
    "roadmap.zoomMonth": "Month",
    "roadmap.zoomWeek": "Weeks",
    "roadmap.zoomDay": "Days",
    "roadmap.expandAll": "Expand all",
    "roadmap.collapseAll": "Collapse all",
    "roadmap.search": "Search an issue…",
    "roadmap.noResults": "No results",
    "roadmap.late": "Overdue",
    "roadmap.by": "by",
    "roadmap.sortMs": "Milestones",
    "roadmap.sortIssues": "Issues",
    "roadmap.sortDefault": "Default order",
    "roadmap.sortDue": "By due date",
    "roadmap.sortName": "By name",
    "roadmap.sortProgress": "By progress",
    "roadmap.sortChrono": "Chronological",
    "roadmap.sortStatus": "By status",
    "roadmap.sortNumber": "By number",

    "milestones.due": "Due",
    "milestones.noDue": "No date",
    "milestones.tasks": "requests",
    "milestones.view": "View issues",
    "mt.milestone": "Milestone",
    "mt.progress": "Progress",
    "mt.requests": "Requests",
    "mt.due": "Due",

    "form.title": "Submit a request",
    "form.subtitle": "Describe what you need. It comes straight to us.",
    "form.typeLabel": "Request type",
    "form.typeFeature": "Feature",
    "form.typeBug": "Bug",
    "form.typeQuestion": "Question",
    "form.typeOther": "Other",
    "form.titleLabel": "Title",
    "form.titlePlaceholder": "Sum it up in one line",
    "form.descLabel": "Description",
    "form.descPlaceholder":
      "Give the context, what you expect, and how to reproduce it if relevant.",
    "form.nameLabel": "Your name",
    "form.namePlaceholder": "Optional",
    "form.emailLabel": "Email",
    "form.emailPlaceholder": "Optional — so we can follow up",
    "form.optional": "optional",
    "form.submit": "Send request",
    "form.submitting": "Sending…",
    "form.required": "This field is required.",
    "form.successTitle": "Request sent",
    "form.successMsg": "Thanks! Your request has been created.",
    "form.viewIssue": "View the request",
    "form.another": "Send another request",
    "form.errorTitle": "Couldn’t send",
    "form.errorGeneric": "We couldn’t send your request. Please try again shortly.",
    "form.errorNotConfigured": "Request submission isn’t enabled on this deployment yet.",
    "form.close": "Close",

    "cta.title": "Got an idea, a bug, or a question?",
    "cta.subtitle": "Submit a request in seconds.",
    "cta.button": "New request",
    "footer.tagline": "A shared roadmap, powered by GitHub.",
    "footer.source": "Source code",

    "state.loading": "Loading the roadmap…",
    "state.errorTitle": "Couldn’t load the roadmap",
    "state.errorHint": "Check the configured repository",
    "state.empty": "No milestones with issues yet.",

    /* Common */
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.back": "Back",
    "common.loading": "Loading…",

    /* Sidebar */
    "side.overview": "Overview",
    "side.admin": "Administration",
    "side.projects": "Projects",
    "side.newProject": "New project",
    "side.account": "Account",
    "side.logout": "Log out",
    "side.mockBadge": "Mock backend",

    /* Workspace */
    "ws.title": "Your projects",
    "ws.subtitle": "Projects you manage or that are shared with you.",
    "ws.owned": "Owned by you",
    "ws.joined": "Shared with you",
    "ws.empty": "No projects yet.",
    "ws.createFirst": "Create your first project",
    "ws.open": "Open",
    "ws.manage": "Manage",
    "ws.members": "members",
    "ws.pending": "pending",

    /* Status */
    "status.available": "Available on Vista",
    "status.unavailable": "Hidden",
    "status.shared": "Shared",
    "status.private": "Private",

    /* Roles */
    "role.owner": "Owner",
    "role.editor": "Editor",
    "role.viewer": "Viewer",

    /* Admin */
    "admin.title": "Administration",
    "admin.subtitle": "Choose which projects are available on Vista and which to share.",
    "admin.stat.projects": "Projects",
    "admin.stat.available": "Available",
    "admin.stat.shared": "Shared",
    "admin.stat.pending": "Pending requests",
    "admin.col.project": "Project",
    "admin.col.visibility": "Visibility",
    "admin.col.available": "Available",
    "admin.col.members": "Members",
    "admin.col.requests": "Requests",
    "admin.col.manage": "Manage",
    "admin.empty": "No projects yet. Create one to get started.",

    /* New project */
    "np.title": "New project",
    "np.subtitle": "Create a roadmap space to share.",
    "np.name": "Project name",
    "np.namePh": "Website redesign, Mobile app…",
    "np.desc": "Description",
    "np.descPh": "What is this project about?",
    "np.source": "Data source",
    "np.sourceMock": "Demo",
    "np.sourceMockHint": "Sample roadmap, perfect for testing.",
    "np.sourceGithub": "GitHub",
    "np.sourceGithubHint": "Reads your milestones & issues.",
    "np.repo": "Repository (owner/repo)",
    "np.repoPh": "octocat/Hello-World",
    "np.visibility": "Visibility",
    "np.visPrivate": "Private",
    "np.visShared": "Shared (via link)",
    "np.available": "Available on Vista right away",
    "np.create": "Create project",
    "np.creating": "Creating…",

    /* Project settings */
    "ps.back": "All projects",
    "ps.tab.general": "General",
    "ps.tab.members": "Members",
    "ps.tab.requests": "Access requests",
    "ps.tab.invite": "Invite",
    "ps.gen.title": "Settings",
    "ps.gen.name": "Project name",
    "ps.gen.desc": "Description",
    "ps.gen.visibility": "Visibility",
    "ps.gen.visPrivate": "Private — invite only",
    "ps.gen.visShared": "Shared — reachable via an invite link",
    "ps.gen.available": "Available on Vista",
    "ps.gen.availableHint": "When off, the project is hidden from the platform and links.",
    "ps.gen.save": "Save changes",
    "ps.gen.saved": "Saved",
    "ps.danger": "Danger zone",
    "ps.dangerHint": "Deletion is permanent and cannot be undone.",
    "ps.delete": "Delete project",
    "ps.deleteConfirm": "Permanently delete this project?",
    "ps.mem.title": "Active members",
    "ps.mem.empty": "No active members.",
    "ps.mem.you": "You",
    "ps.mem.remove": "Remove",
    "ps.req.title": "Pending requests",
    "ps.req.empty": "No pending requests.",
    "ps.req.requested": "requested access",
    "ps.req.approve": "Approve",
    "ps.req.deny": "Deny",
    "ps.req.role": "Assigned role",
    "ps.inv.title": "Invite link",
    "ps.inv.desc": "Share this link so a client can request access.",
    "ps.inv.copy": "Copy link",
    "ps.inv.copied": "Copied",
    "ps.inv.rotate": "Regenerate",
    "ps.inv.disabledHint": "Turn on sharing (General) to generate a link.",

    /* Project dashboard */
    "pd.back": "Projects",
    "pd.manage": "Manage project",
    "pd.viewerNote": "You’re viewing this project in read-only mode.",

    /* Join via link */
    "join.invitedTo": "You’re invited to follow",
    "join.intro": "Request access to follow this project’s progress.",
    "join.request": "Request access",
    "join.requesting": "Sending…",
    "join.requested": "Request sent",
    "join.requestedMsg": "The owner must approve your access. Check back later.",
    "join.member": "You already have access",
    "join.memberMsg": "You’re a member of this project.",
    "join.open": "Open project",
    "join.pending": "Request pending",
    "join.pendingMsg": "Your request is being reviewed by the owner.",
    "join.invalid": "Invalid link",
    "join.invalidMsg": "This invite link is invalid, expired, or the project is no longer shared.",
    "join.home": "Back to home",
  },
};

// ─── Context ─────────────────────────────────────────────
const I18nContext = createContext(null);
const DEFAULT_LANG = "fr";

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof localStorage === "undefined") return DEFAULT_LANG;
    const saved = localStorage.getItem("vista-lang");
    return saved === "en" || saved === "fr" ? saved : DEFAULT_LANG;
  });

  useEffect(() => {
    localStorage.setItem("vista-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const dict = STRINGS[lang];
  const t = (key) => dict[key] ?? key;
  const locale = dict.locale;

  return createElement(I18nContext.Provider, { value: { lang, setLang, t, locale } }, children);
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
