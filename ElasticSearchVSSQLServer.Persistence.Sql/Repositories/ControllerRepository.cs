using AutoMapper;
using ElasticSearchVSSQLServer.Domain.Repositories;
using ElasticSearchVSSQLServer.Persistence.Controller;
using ElasticSearchVSSQLServer.Persistence.Sql.Context;
using Microsoft.EntityFrameworkCore;

namespace ElasticSearchVSSQLServer.Persistence.Sql.Repositories;

class ControllerRepository(ApplicationDBService dbContext, IMapper mapper) : IControllerRepository {

    private ApplicationDbContext _dbContext = dbContext.DbContext;
    protected  DbSet<Context.Controller> dbset;

    public async Task<ControllerDTO> AddAsync(ControllerDTO dtoEntity) {
        dbset = _dbContext.Set<Context.Controller>();
        var itemToAdd = mapper.Map<Context.Controller>(dtoEntity);
        await dbset.AddAsync(itemToAdd);
        await _dbContext.SaveChangesAsync();
        return mapper.Map<ControllerDTO>(itemToAdd);
    }

    public async Task<IEnumerable<ControllerDTO>> GetAllAsync() {
        dbset = _dbContext.Set<Context.Controller>();
        var itemsToGet = await dbset.Include(c => c.Action).ToListAsync();
        return mapper.Map<IEnumerable<ControllerDTO>>(itemsToGet);
    }

    public async Task<ControllerDTO> GetByIdAsync(int id) {
        dbset = _dbContext.Set<Context.Controller>();
        var itemToGet = await dbset.Include(c => c.Action).Where(x=>x.ControllerId == id).FirstOrDefaultAsync();
        return mapper.Map<ControllerDTO>(itemToGet);
    }

    public async Task<ControllerDTO> UpdateAsync(int id, ControllerDTO dtoEntity) {
        dbset = _dbContext.Set<Context.Controller>();
        var itemToUpdate = await dbset.Include(c=>c.Action).Where(x=>x.ControllerId == id).FirstOrDefaultAsync();
        mapper.Map(dtoEntity, itemToUpdate);
        await _dbContext.SaveChangesAsync();
        return mapper.Map<ControllerDTO>(itemToUpdate);
    }
}
