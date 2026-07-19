(function () {
  const STORAGE_KEY = "tinytale-cookie-consent";
  const banner = document.getElementById("cookie-consent");
  if (!banner) return;

  const acceptButton = banner.querySelector("[data-cookie-accept]");
  const declineButton = banner.querySelector("[data-cookie-decline]");
  if (!acceptButton || !declineButton) return;

  const getConsent = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const setConsent = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore storage failures (private mode, etc.)
    }
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
    });
  };

  const hideBanner = () => {
    banner.hidden = true;
  };

  const showBanner = () => {
    banner.hidden = false;
  };

  const accept = () => {
    setConsent("granted");
    hideBanner();
    initPostHog();
  };

  const clearPostHogStorage = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("ph_") || key.includes("posthog"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage failures
    }

    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (!name.startsWith("ph_") && !name.includes("posthog")) return;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  };

  const decline = () => {
    setConsent("denied");
    hideBanner();
    if (window.posthog && typeof window.posthog.opt_out_capturing === "function") {
      window.posthog.opt_out_capturing();
    }
    clearPostHogStorage();
  };

  acceptButton.addEventListener("click", accept);
  declineButton.addEventListener("click", decline);

  const consent = getConsent();
  if (consent === "granted") {
    initPostHog();
    return;
  }
  if (consent === "denied") {
    clearPostHogStorage();
    return;
  }
  showBanner();
})();
