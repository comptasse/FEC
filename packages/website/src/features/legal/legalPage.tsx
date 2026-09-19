import { Link } from "@tanstack/react-router"
import { css } from "../../../styled-system/css/css"

export function LegalPage() {
    return (
        <div
            className={css({
                width: "100%",
                minHeight: "100dvh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                alignItems: "start",
                backgroundColor: "background",
            })}
        >
            {/* Content */}
            <div
                className={css({
                    width: "100%",
                    maxWidth: "64rem",
                    marginX: "auto",
                    paddingX: "2rem",
                    paddingY: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                })}
            >
                <div className={css({ display: "flex", flexDirection: "column", gap: "0.5rem" })}>
                    <h1
                        className={css({
                            color: "primary",
                            fontSize: "2rem",
                            fontWeight: "400",
                            letterSpacing: "-0.02em",
                        })}
                    >
                        Mentions l&eacute;gales
                    </h1>
                    <p className={css({ color: "neutral/50", fontSize: "1rem", lineHeight: "1.6" })}>
                        Informations l&eacute;gales relatives au service Comptasse FEC.
                    </p>
                </div>

                <section className={css({ display: "flex", flexDirection: "column", gap: "0.75rem" })}>
                    <h2 className={css({ color: "neutral", fontSize: "1.25rem", fontWeight: "400" })}>
                        &Eacute;diteur du site
                    </h2>
                    <p className={css({ color: "neutral/75", fontSize: "0.9375rem", lineHeight: "1.6" })}>
                        Le service Comptasse FEC est &eacute;dit&eacute; par Barbote SAS, soci&eacute;t&eacute; par
                        actions simplifi&eacute;e, immatricul&eacute;e au Registre du Commerce et des
                        Soci&eacute;t&eacute;s sous le num&eacute;ro 908 719 503.
                    </p>
                    <ul
                        className={css({
                            color: "neutral/75",
                            fontSize: "0.9375rem",
                            lineHeight: "1.8",
                            paddingLeft: "1.5rem",
                            listStyleType: "disc",
                        })}
                    >
                        <li>Si&egrave;ge social : 93 rue Sedaine, 75011 Paris, France</li>
                        <li>Num&eacute;ro de TVA intracommunautaire : FR02 908 719 503</li>
                        <li>
                            Contact :{" "}
                            <a
                                href="mailto:contact@comptasse.com"
                                className={css({ color: "primary", _hover: { textDecoration: "underline" } })}
                            >
                                contact@comptasse.com
                            </a>
                        </li>
                    </ul>
                </section>

                <section className={css({ display: "flex", flexDirection: "column", gap: "0.75rem" })}>
                    <h2 className={css({ color: "neutral", fontSize: "1.25rem", fontWeight: "400" })}>
                        H&eacute;bergement
                    </h2>
                    <p className={css({ color: "neutral/75", fontSize: "0.9375rem", lineHeight: "1.6" })}>
                        Le site est h&eacute;berg&eacute; par OVH SAS, immatricul&eacute;e au RCS Lille M&eacute;tropole
                        sous le num&eacute;ro 424 761 419 00045.
                    </p>
                    <ul
                        className={css({
                            color: "neutral/75",
                            fontSize: "0.9375rem",
                            lineHeight: "1.8",
                            paddingLeft: "1.5rem",
                            listStyleType: "disc",
                        })}
                    >
                        <li>Si&egrave;ge social : 2 rue Kellermann, 59100 Roubaix, France</li>
                        <li>T&eacute;l&eacute;phone : 1007</li>
                    </ul>
                </section>

                <section className={css({ display: "flex", flexDirection: "column", gap: "0.75rem" })}>
                    <h2 className={css({ color: "neutral", fontSize: "1.25rem", fontWeight: "400" })}>
                        Propri&eacute;t&eacute; intellectuelle
                    </h2>
                    <p className={css({ color: "neutral/75", fontSize: "0.9375rem", lineHeight: "1.6" })}>
                        Le code source d'Comptasse FEC est distribu&eacute; sous licence{" "}
                        <a
                            href="https://www.gnu.org/licenses/agpl-3.0.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={css({ color: "primary", _hover: { textDecoration: "underline" } })}
                        >
                            AGPL-3.0
                        </a>
                        . Le code source est disponible sur{" "}
                        <a
                            href="https://github.com/comptasse"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={css({ color: "primary", _hover: { textDecoration: "underline" } })}
                        >
                            GitHub
                        </a>
                        . Les contenus &eacute;ditoriaux du service restent la propri&eacute;t&eacute; de
                        l'&eacute;diteur, sauf mention contraire.
                    </p>
                </section>

                <section className={css({ display: "flex", flexDirection: "column", gap: "0.75rem" })}>
                    <h2 className={css({ color: "neutral", fontSize: "1.25rem", fontWeight: "400" })}>
                        Protection des donn&eacute;es et vie priv&eacute;e
                    </h2>
                    <p className={css({ color: "neutral/75", fontSize: "0.9375rem", lineHeight: "1.6" })}>
                        Comptasse FEC est un outil de validation de Fichiers des &Eacute;critures Comptables qui
                        fonctionne enti&egrave;rement en local, dans votre navigateur. Aucune donn&eacute;e de votre
                        fichier FEC n'est envoy&eacute;e vers un serveur.
                    </p>
                    <ul
                        className={css({
                            color: "neutral/75",
                            fontSize: "0.9375rem",
                            lineHeight: "1.8",
                            paddingLeft: "1.5rem",
                            listStyleType: "disc",
                        })}
                    >
                        <li>L'ensemble du traitement est effectu&eacute; localement dans votre navigateur</li>
                        <li>
                            Aucune donn&eacute;e de fichier FEC n'est transmise, stock&eacute;e ou journalis&eacute;e
                            sur un serveur
                        </li>
                        <li>Aucune donn&eacute;e personnelle n'est collect&eacute;e</li>
                        <li>Aucun cookie n'est utilis&eacute;, y compris les cookies fonctionnels</li>
                        <li>Aucun outil d'analyse ou de suivi (analytics, tracking) n'est mis en &oelig;uvre</li>
                        <li>Le code source est ouvert et peut &ecirc;tre audit&eacute; par quiconque</li>
                    </ul>
                </section>

                <section className={css({ display: "flex", flexDirection: "column", gap: "0.75rem" })}>
                    <h2 className={css({ color: "neutral", fontSize: "1.25rem", fontWeight: "400" })}>Cookies</h2>
                    <p className={css({ color: "neutral/75", fontSize: "0.9375rem", lineHeight: "1.6" })}>
                        Aucun cookie n'est utilis&eacute; par ce service. Comptasse FEC ne d&eacute;pose aucun cookie,
                        qu'il soit fonctionnel, analytique ou publicitaire.
                    </p>
                </section>

                <section className={css({ display: "flex", flexDirection: "column", gap: "0.75rem" })}>
                    <h2 className={css({ color: "neutral", fontSize: "1.25rem", fontWeight: "400" })}>
                        Limitation de responsabilit&eacute;
                    </h2>
                    <p className={css({ color: "neutral/75", fontSize: "0.9375rem", lineHeight: "1.6" })}>
                        Les r&eacute;sultats de validation fournis par Comptasse FEC le sont &agrave; titre informatif
                        uniquement et ne constituent en aucun cas un conseil fiscal ou comptable. L'&eacute;diteur ne
                        saurait &ecirc;tre tenu responsable des erreurs ou omissions dans les r&eacute;sultats de
                        validation. Il est recommand&eacute; de v&eacute;rifier vos fichiers FEC avec les outils
                        officiels de la{" "}
                        <a
                            href="https://www.impots.gouv.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={css({ color: "primary", _hover: { textDecoration: "underline" } })}
                        >
                            DGFiP
                        </a>
                        .
                    </p>
                </section>

                <div
                    className={css({
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        paddingTop: "1rem",
                    })}
                >
                    <Link
                        to="/"
                        className={css({
                            color: "primary",
                            fontSize: "0.9375rem",
                            _hover: { textDecoration: "underline" },
                        })}
                    >
                        &larr; Retour &agrave; l'accueil
                    </Link>
                    <p className={css({ color: "neutral/25", fontSize: "0.8125rem" })}>
                        Derni&egrave;re mise &agrave; jour : 23 mars 2026
                    </p>
                </div>
            </div>
        </div>
    )
}
