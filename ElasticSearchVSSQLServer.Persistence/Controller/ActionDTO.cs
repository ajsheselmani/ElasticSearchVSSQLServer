namespace ElasticSearchVSSQLServer.Persistence.Controller;

public class ActionDTO {
    public int ActionId { get; set; }
    public int ControllerId { get; set; }
    public string Name { get; set; }
    public string Type { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public bool Active { get; set; }
}
