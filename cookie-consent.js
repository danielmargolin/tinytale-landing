(function () {
  const LEGACY_STORAGE_KEY = "tinytale-cookie-consent";
  const APP_HOSTS = {
    "tinytaleapp.com": true,
    "www.tinytaleapp.com": true,
  };
  const DISTINCT_ID_PARAM = "phDistinctId";
  const SESSION_ID_PARAM = "phSessionId";

  function isAppUrl(url) {
    return Boolean(APP_HOSTS[url.hostname]);
  }

  function appendIdentity(href) {
    try {
      const url = new URL(href, window.location.origin);
      if (!isAppUrl(url)) return href;
      if (!window.posthog || typeof window.posthog.get_distinct_id !== "function") {
        return href;
      }

      const distinctId = window.posthog.get_distinct_id();
      if (!distinctId) return href;

      url.searchParams.set(DISTINCT_ID_PARAM, distinctId);
      if (typeof window.posthog.get_session_id === "function") {
        const sessionId = window.posthog.get_session_id();
        if (sessionId) url.searchParams.set(SESSION_ID_PARAM, sessionId);
      }

      if (typeof window.posthog.createPersonProfile === "function") {
        window.posthog.createPersonProfile();
      }

      return url.toString();
    } catch {
      return href;
    }
  }

  window.appendTinyTalePostHogIdentity = appendIdentity;

  document.addEventListener(
    "click",
    function (event) {
      const target = event.target;
      if (!target || typeof target.closest !== "function") return;
      const anchor = target.closest("a[href]");
      if (!anchor) return;
      const next = appendIdentity(anchor.href);
      if (next !== anchor.href) anchor.href = next;
    },
    true,
  );

  function ensureStyles() {
    if (document.querySelector('link[href*="cookie-consent.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/cookie-consent.css";
    document.head.appendChild(link);
  }

  function ensureBanner() {
    let banner = document.getElementById("cookie-consent");
    if (banner) return banner;

    ensureStyles();
    banner = document.createElement("aside");
    banner.className = "cookie-consent";
    banner.id = "cookie-consent";
    banner.setAttribute("aria-labelledby", "cookie-consent-title");
    banner.setAttribute("aria-describedby", "cookie-consent-text");
    banner.hidden = true;
    banner.innerHTML =
      '<h2 class="cookie-consent__title" id="cookie-consent-title">שימוש בעוגיות</h2>' +
      '<p class="cookie-consent__text" id="cookie-consent-text">' +
      "אנחנו משתמשים בעוגיות לניתוח השימוש באתר ולשיפור השירות. לפרטים נוספים ראו את " +
      '<a class="cookie-consent__link" href="/">מדיניות הפרטיות</a>.' +
      "</p>" +
      '<div class="cookie-consent__actions">' +
      '<button class="cta-button cookie-consent__accept" type="button" data-cookie-accept>אישור</button>' +
      '<button class="cookie-consent__decline" type="button" data-cookie-decline>סירוב</button>' +
      "</div>";
    document.body.appendChild(banner);
    return banner;
  }

  const banner = ensureBanner();
  const acceptButton = banner.querySelector("[data-cookie-accept]");
  const declineButton = banner.querySelector("[data-cookie-decline]");
  if (!acceptButton || !declineButton) return;

  const hideBanner = () => {
    banner.hidden = true;
  };

  const showBanner = () => {
    banner.hidden = false;
  };

  const applyLegacyConsent = (posthogClient) => {
    let legacy = null;
    try {
      legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    } catch {
      legacy = null;
    }
    if (legacy === "granted") {
      posthogClient.opt_in_capturing();
    } else if (legacy === "denied") {
      posthogClient.opt_out_capturing();
    }
    if (legacy) {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // Ignore storage failures
      }
    }
  };

  const syncBannerWithConsent = (posthogClient) => {
    applyLegacyConsent(posthogClient);
    const status =
      typeof posthogClient.get_explicit_consent_status === "function"
        ? posthogClient.get_explicit_consent_status()
        : "pending";
    if (status === "pending") showBanner();
    else hideBanner();
  };

  const initPostHog = () => {
    if (window.__tinytalePostHogInitialized) return;
    window.__tinytalePostHogInitialized = true;

    !(function (t, e) {
      var o, n, p, r;
      e.__SV ||
        (window.posthog && window.posthog.__loaded) ||
        ((window.posthog = e),
        (e._i = []),
        (e.init = function (i, s, a) {
          function g(t, e) {
            var o = e.split(".");
            2 == o.length && ((t = t[o[0]]), (e = o[1])),
              (t[e] = function () {
                t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
              });
          }
          ((p = t.createElement("script")).type = "text/javascript"),
            (p.crossOrigin = "anonymous"),
            (p.async = !0),
            (p.src =
              s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") +
              "/static/array.js"),
            (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(
              p,
              r,
            );
          var u = e;
          for (
            void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
              u.people = u.people || [],
              u.toString = function (t) {
                var e = "posthog";
                return (
                  "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e
                );
              },
              u.people.toString = function () {
                return u.toString(1) + ".people (stub)";
              },
              (o =
                "Ni qi init Xi rn Rr tn sn Ki capture calculateEventProperties dn register register_once register_for_session unregister unregister_for_session fn getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync pn identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty cn un createPersonProfile setInternalOrTestUser vn Qi yn opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing an debug Or Rt getPageViewId captureTraceFeedback captureTraceMetric Wi".split(
                  " ",
                )),
              (n = 0);
            n < o.length;
            n++
          )
            g(u, o[n]);
          e._i.push([i, s, a]);
        }),
        (e.__SV = 1));
    })(document, window.posthog || []);

    posthog.init("phc_7BKFbiviSXSDTiRZmUUNOjAmesJJzEsu1zP0UZETzuL", {
      api_host: "https://eu.i.posthog.com",
      defaults: "2026-05-30",
      person_profiles: "identified_only",
      opt_out_capturing_by_default: true,
      cookieless_mode: "on_reject",
      loaded: function (posthogClient) {
        syncBannerWithConsent(posthogClient);
      },
    });
  };

  acceptButton.addEventListener("click", function () {
    hideBanner();
    if (window.posthog && typeof window.posthog.opt_in_capturing === "function") {
      window.posthog.opt_in_capturing();
    }
  });

  declineButton.addEventListener("click", function () {
    hideBanner();
    if (window.posthog && typeof window.posthog.opt_out_capturing === "function") {
      window.posthog.opt_out_capturing();
    }
  });

  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy !== "granted" && legacy !== "denied") showBanner();
  } catch {
    showBanner();
  }

  initPostHog();
})();
