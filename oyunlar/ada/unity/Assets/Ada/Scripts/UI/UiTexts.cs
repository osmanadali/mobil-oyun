namespace Ada.UI
{
    /// <summary>
    /// Oyun içi Türkçe metinlerin tek merkezi. Scriptlere dağınık sabit metin yazılmaz.
    /// Font: Türkçe karakterleri (ç ğ ı İ ö ş ü) içeren TMP Font Asset (Latin Extended-A).
    /// </summary>
    public static class UiTexts
    {
        public const string FinalTitle = "FİNAL ATIŞI";
        public const string FinalSubtitle = "3 hedefi devir";
        public const string TutorialAim = "Nişan almak için geri çek";
        public const string TutorialRelease = "Atmak için bırak";
        public const string Hit = "İSABET!";
        public const string Miss = "Tekrar dene";
        public const string StageComplete = "ETAP TAMAMLANDI!";
        public const string Continue = "Devam";
        public const string PlayAgain = "Tekrar oyna";

        /// <summary>"Hedef: n/toplam" metinlerini bir kez üretir (oyun sırasında bellek ayırmaz).</summary>
        public static string[] BuildTargetCounters(int total)
        {
            var arr = new string[total + 1];
            for (int i = 0; i <= total; i++) arr[i] = "Hedef: " + i + "/" + total;
            return arr;
        }
    }
}
