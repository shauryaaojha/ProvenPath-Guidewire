package provenpath.pcmock

uses io.javalin.Javalin
uses java.util.Map

/** 
 * PolicyCenter Mock
 * Provides endpoints for /pc/create_product, /pc/add_coverage, /pc/configure_rating, /pc/deploy_product 
 */
class Main {
  static function main(args : String[]) {
    var port = System.getenv("PORT")
    if (port == null) {
      port = "8180"
    }
    
    var app = Javalin.create(\config -> {
      config.http.defaultContentType = "application/json"
    }).start(Integer.parseInt(port))

    app.get("/health", \ctx -> ctx.json(Map.of("status", "UP", "service", "pcmock")))

    app.post("/pc/create_product", \ctx -> {
      ctx.json(Map.of("status", "success", "message", "Product created"))
    })
    
    app.post("/pc/add_coverage", \ctx -> {
      ctx.json(Map.of("status", "success", "message", "Coverage added"))
    })
    
    app.post("/pc/configure_rating", \ctx -> {
      ctx.json(Map.of("status", "success", "message", "Rating configured"))
    })
    
    app.post("/pc/deploy_product", \ctx -> {
      ctx.json(Map.of("status", "success", "message", "Product deployed"))
    })
    
    System.out.println("PolicyCenter mock started on port " + port)
  }
}
