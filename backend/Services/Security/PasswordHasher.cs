using System.Security.Cryptography;

namespace backend.Services.Security
{
    // PBKDF2 (intégré à .NET, pas de dépendance externe type BCrypt).
    // Format stocké : "<iterations>.<sel base64>.<hash base64>".
    // Les itérations sont embarquées dans le hash stocké (plutôt qu'une constante fixe) pour
    // pouvoir relever ITERATIONS_COURANTES dans le futur sans invalider les mots de passe déjà
    // enregistrés : Verify relit le nombre d'itérations utilisé à la création de CE hash précis.
    // Ancien format à 2 segments (sans itérations) accepté en lecture pour compat rétroactive.
    public static class PasswordHasher
    {
        private const int SaltSize = 16;
        private const int HashSize = 32;
        private const int CurrentIterations = 600_000; // recommandation OWASP (PBKDF2-HMAC-SHA256, 2023)
        private const int LegacyIterations = 100_000; // valeur utilisée par les hashs au format à 2 segments

        public static string Hash(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, CurrentIterations, HashAlgorithmName.SHA256, HashSize);
            return $"{CurrentIterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
        }

        public static bool Verify(string password, string storedHash)
        {
            var parts = storedHash.Split('.');

            int iterations;
            string saltPart, hashPart;
            switch (parts.Length)
            {
                case 3:
                    if (!int.TryParse(parts[0], out iterations) || iterations <= 0) return false;
                    saltPart = parts[1];
                    hashPart = parts[2];
                    break;
                case 2:
                    iterations = LegacyIterations;
                    saltPart = parts[0];
                    hashPart = parts[1];
                    break;
                default:
                    return false;
            }

            byte[] salt, expectedHash;
            try
            {
                salt = Convert.FromBase64String(saltPart);
                expectedHash = Convert.FromBase64String(hashPart);
            }
            catch (FormatException)
            {
                return false;
            }

            var actualHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expectedHash.Length);
            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
    }
}
