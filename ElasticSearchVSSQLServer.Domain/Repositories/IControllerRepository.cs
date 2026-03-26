namespace ElasticSearchVSSQLServer.Domain.Repositories;

using ElasticSearchVSSQLServer.Persistence.Controller;

public interface IControllerRepository {
    Task<ControllerDTO> GetByIdAsync(int id);

    Task<IEnumerable<ControllerDTO>> GetAllAsync();

    Task<ControllerDTO> AddAsync(ControllerDTO dtoEntity);

    Task<ControllerDTO> UpdateAsync(int id, ControllerDTO dtoEntity);
}