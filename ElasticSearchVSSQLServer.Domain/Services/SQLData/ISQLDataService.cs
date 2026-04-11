using ElasticSearchVSSQLServer.Persistence.SQLData;
using System;
using System.Collections.Generic;
using System.Text;

namespace ElasticSearchVSSQLServer.Domain.Services.SQLData;
public interface ISQLDataService
{
    Task<IEnumerable<BankDatasetDTO>> GetAllBankData();
    Task<IEnumerable<ElectronicEventsDTO>> GetAllElectronicEvents();
}