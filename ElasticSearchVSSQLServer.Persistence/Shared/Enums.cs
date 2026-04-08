namespace ElasticSearchVSSQLServer.Persistence.Shared;

public enum GenderEnum {
    Male = 1,
    Female = 2
}

public enum LanguageEnum {
    Albanian = 1,
    English = 2,
    Serbian = 3
}

public enum ErrorTypeEnum {
    Error = 1,
    Warning,
    Info
}
public enum EmailTemplateEnum
{
    NewUser = 1,
    ResetAccount = 2,
    UserVerification = 3,
    UserBlocked=19,
    ErrorReport= 49
}
public enum ReturnFundsReasonEnum
{
	UnirefMismach = 1,
	ConfirmationEarlier = 2,
	AmountMismatch = 3,
	Inactive = 4,
	BankAccountMismatch = 5,
}
public enum ConfigurationEnum
{
	PaymentAmount = 3,
}

public enum StatusTypeEnum
{
	Pending = 1,
	Refunded = 2,
	Equivalent = 3,
	TechnicalError = 4
}

public enum ReportType
{
    PDF = 0,
    Excel = 1,
    Word = 2,
    CSV = 3,
    XML = 4,
    JSON = 5
}
public enum ReportOrientation
{
    Portrait,
    Landscape
}