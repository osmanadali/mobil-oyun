using UnityEngine;

namespace Ada.UI
{
    /// <summary>Canvas altındaki kök paneli Screen.safeArea'ya oturtur (çentik, ev çubuğu). Yalnız değişince günceller.</summary>
    [RequireComponent(typeof(RectTransform))]
    public sealed class SafeAreaFitter : MonoBehaviour
    {
        RectTransform rt;
        Rect last;
        Vector2Int lastSize;

        void Awake()
        {
            rt = (RectTransform)transform;
            Apply();
        }

        void Update()
        {
            if (Screen.safeArea != last || Screen.width != lastSize.x || Screen.height != lastSize.y) Apply();
        }

        void Apply()
        {
            last = Screen.safeArea;
            lastSize = new Vector2Int(Screen.width, Screen.height);
            if (Screen.width <= 0 || Screen.height <= 0) return;
            Vector2 min = last.position, max = last.position + last.size;
            min.x /= Screen.width; min.y /= Screen.height;
            max.x /= Screen.width; max.y /= Screen.height;
            rt.anchorMin = min;
            rt.anchorMax = max;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }
    }
}
