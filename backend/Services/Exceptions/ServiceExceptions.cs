namespace backend.Services.Exceptions
{
    // Traduites en codes HTTP par le middleware global dans Program.cs,
    // pour garder les Controllers fins (pas de try/catch répété partout).
    public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message) { }
    }

    public class ConflictException : Exception
    {
        public ConflictException(string message) : base(message) { }
    }

    public class UnauthorizedAppException : Exception
    {
        public UnauthorizedAppException(string message) : base(message) { }
    }

    public class BadRequestException : Exception
    {
        public BadRequestException(string message) : base(message) { }
    }

    public class ForbiddenException : Exception
    {
        public ForbiddenException(string message) : base(message) { }
    }

    public class TooManyRequestsException : Exception
    {
        public TooManyRequestsException(string message) : base(message) { }
    }

    // Dépendance absente ou indisponible (fournisseur OAuth non configuré ou injoignable).
    public class ServiceUnavailableException : Exception
    {
        public ServiceUnavailableException(string message) : base(message) { }
    }
}
