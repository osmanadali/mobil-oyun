using System;
using UnityEngine;

namespace Ada.CameraSystem
{
    public enum CamProfileId { Bridge, Aim, Dive, Finish }

    [Serializable]
    public class CamProfile
    {
        public CamProfileId id;
        [Range(0f, 89f)] public float pitchDeg = 55f;
        public float yawDeg = 0f;
        [Range(20f, 90f)] public float fovDeg = 50f;
        public float distance = 9f;
        [Tooltip("Takip yumuşaması (sn). Cinemachine ile birlikte KULLANMAYIN: tek yumuşatma.")]
        public float smoothTime = 0.14f;
        [Tooltip("Köprü: kamera sütunların merkezinde kalır, şerit değişiminde yana kaymaz.")]
        public bool lockLateral = true;
        public float lateralX = 0f;
        [Tooltip("Zıplama yüksekliğini izleme; odak sabit yükseklikte.")]
        public bool ignoreTargetHeight = true;
        public float fixedHeight = 0.55f;
        [Tooltip("Odak, parkur yönünde oyuncunun bu kadar önünde (sonraki sıralar görünür).")]
        public float lookAhead = 2.5f;
        public Vector3 focusOffset = new Vector3(0f, 0.9f, 0f);
        public bool underwaterEffects;
        [Tooltip("Doluysa kamera bu sahne noktasına gider ve orada SABİT durur (ör. final atış kadrajı). Diğer alanlar yok sayılır.")]
        public Transform fixedPose;
        [Tooltip(">0 ise dar ekranlarda yatay görüş açısı en az bu değer olacak şekilde dikey FOV büyütülür (kenarlar kesilmez).")]
        public float minHorizontalFovDeg = 0f;
    }

    /// <summary>
    /// Script tabanlı kamera (Cinemachine yok, tek yumuşatma). Parkur çerçevesinde (courseFrame: +Z ileri) çalışır.
    /// Sarsıntı taban konuma eklenir, yumuşatmaya karışmaz ve unscaled zamanla çalışır (hit-stop sırasında da oynar).
    /// </summary>
    public sealed class CameraRig : MonoBehaviour
    {
        [SerializeField] Camera cam;
        [SerializeField] Transform target;       // PlayerRoot/CameraTarget
        [SerializeField] Transform courseFrame;  // parkur yönü; köprünün başlangıç noktası
        [SerializeField] CamProfile[] profiles;
        [SerializeField] float profileBlendSeconds = 0.5f;

        [Header("Su altı")]
        [SerializeField] float waterSurfaceY = 0f;
        [SerializeField] Color underwaterFogColor = new Color(0.16f, 0.55f, 0.6f);
        [SerializeField] float underwaterFogDensity = 0.12f;
        [SerializeField] CanvasGroup underwaterTint;   // %15–25 turkuaz tam ekran görüntü

        CamProfile current;
        Vector3 basePos, velocity;
        Quaternion rotFrom;
        float fovFrom, blend = 1f;
        float shakeStart, shakeDuration, shakeAmplitude;
        bool fogDefault;
        Color fogColorDefault;
        float fogDensityDefault;
        FogMode fogModeDefault;

        void Awake()
        {
            basePos = transform.position;
            // Dekoratif tam ekran örtü dokunuşları yutmasın (TouchInput UI elemesi).
            if (underwaterTint)
            {
                underwaterTint.blocksRaycasts = false;
                underwaterTint.interactable = false;
            }
            fogDefault = RenderSettings.fog;
            fogColorDefault = RenderSettings.fogColor;
            fogDensityDefault = RenderSettings.fogDensity;
            fogModeDefault = RenderSettings.fogMode;
            if (profiles != null && profiles.Length > 0) SetProfile(profiles[0].id, instant: true);
        }

        public void SetProfile(CamProfileId id, bool instant = false)
        {
            foreach (var p in profiles)
            {
                if (p.id != id) continue;
                current = p;
                rotFrom = transform.rotation;
                fovFrom = cam.fieldOfView;
                blend = instant ? 1f : 0f;
                if (instant)
                {
                    basePos = DesiredPosition(out Quaternion r);
                    transform.SetPositionAndRotation(basePos, r);
                    cam.fieldOfView = FitFov(p);
                    velocity = Vector3.zero;
                }
                return;
            }
            Debug.LogWarning($"CameraRig: profil yok: {id}", this);
        }

        /// <summary>Ekran yüksekliğinin oranı cinsinden genlik (ör. 0,0025 = %0,25).</summary>
        public void Shake(float seconds, float screenHeightFraction)
        {
            shakeStart = Time.unscaledTime;
            shakeDuration = Mathf.Max(0.01f, seconds);
            shakeAmplitude = screenHeightFraction;
        }

        float FitFov(CamProfile p)
        {
            if (p.minHorizontalFovDeg <= 0f || cam.aspect <= 0f) return p.fovDeg;
            float needed = 2f * Mathf.Atan(Mathf.Tan(p.minHorizontalFovDeg * 0.5f * Mathf.Deg2Rad) / cam.aspect) * Mathf.Rad2Deg;
            return Mathf.Clamp(Mathf.Max(p.fovDeg, needed), 20f, 90f);
        }

        Vector3 DesiredPosition(out Quaternion rot)
        {
            var p = current;
            if (p.fixedPose)
            {
                rot = p.fixedPose.rotation;
                return p.fixedPose.position;
            }
            Vector3 local = courseFrame.InverseTransformPoint(target.position);
            if (p.lockLateral) local.x = p.lateralX;
            if (p.ignoreTargetHeight) local.y = p.fixedHeight;
            local.z += p.lookAhead;
            Vector3 focus = courseFrame.TransformPoint(local) + p.focusOffset;
            Vector3 fwd = courseFrame.forward;
            fwd.y = 0f;
            if (fwd.sqrMagnitude < 1e-6f) fwd = Vector3.forward;
            rot = Quaternion.LookRotation(fwd.normalized, Vector3.up) * Quaternion.Euler(p.pitchDeg, p.yawDeg, 0f);
            return focus - rot * Vector3.forward * p.distance;
        }

        void LateUpdate()
        {
            if (current == null || target == null || courseFrame == null) return;
            float dt = Time.deltaTime;
            Vector3 desired = DesiredPosition(out Quaternion rot);
            if (dt > 0f) basePos = Vector3.SmoothDamp(basePos, desired, ref velocity, current.smoothTime, Mathf.Infinity, dt);

            if (blend < 1f) blend = Mathf.Min(1f, blend + Time.unscaledDeltaTime / Mathf.Max(0.01f, profileBlendSeconds));
            float e = blend * blend * (3f - 2f * blend);
            Quaternion r = Quaternion.Slerp(rotFrom, rot, e);
            cam.fieldOfView = Mathf.Lerp(fovFrom, FitFov(current), e);

            transform.SetPositionAndRotation(basePos + ShakeOffset(r), r);
            UpdateUnderwater();
        }

        Vector3 ShakeOffset(Quaternion r)
        {
            float t = (Time.unscaledTime - shakeStart) / shakeDuration;
            if (shakeAmplitude <= 0f || t >= 1f) return Vector3.zero;
            float dist = current.fixedPose ? Vector3.Distance(transform.position, target.position) : current.distance;
            float worldHeight = 2f * dist * Mathf.Tan(cam.fieldOfView * 0.5f * Mathf.Deg2Rad);
            float amp = shakeAmplitude * worldHeight * (1f - t);
            float s = Time.unscaledTime * 40f;
            float x = (Mathf.PerlinNoise(s, 0.37f) - 0.5f) * 2f;
            float y = (Mathf.PerlinNoise(0.71f, s) - 0.5f) * 2f;
            return r * new Vector3(x, y, 0f) * amp;
        }

        void UpdateUnderwater()
        {
            bool under = current.underwaterEffects && transform.position.y < waterSurfaceY;
            if (under)
            {
                RenderSettings.fog = true;
                RenderSettings.fogMode = FogMode.Exponential;
                RenderSettings.fogColor = underwaterFogColor;
                RenderSettings.fogDensity = underwaterFogDensity;
            }
            else
            {
                RenderSettings.fog = fogDefault;
                RenderSettings.fogMode = fogModeDefault;
                RenderSettings.fogColor = fogColorDefault;
                RenderSettings.fogDensity = fogDensityDefault;
            }
            if (underwaterTint) underwaterTint.alpha = under ? 1f : 0f;
        }
    }
}
