package lambda;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.simple.JSONObject;
import org.json.simple.parser.ParseException;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import dto.RequestBodyDto;
import util.BadRequestException;
import util.JasperUtil;
import util.RequestUtil;

public class Report implements RequestStreamHandler {

  static Logger logger = Logger.getLogger(Report.class.getName());
  private ObjectMapper mapper = new ObjectMapper();

  public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context)
      throws IOException {

    logger.log(Level.INFO, "Lambda Start");
    JSONObject responseJson = new JSONObject();

    try {
      RequestBodyDto body = RequestUtil.extractRequestBody(inputStream, mapper);

      JasperUtil jasperUtil = new JasperUtil();
      String encodedReport = jasperUtil.generateBase64Report(
          body.getTemplatePath(),
          body.getParameters(),
          body.getData());
      buildSuccessfulResponse(encodedReport, responseJson);

    } catch (BadRequestException | ParseException e) {
      this.buildErrorResponse(e.getMessage(), 400, responseJson);
    } catch (Exception e) {
      logger.log(Level.WARNING, "global exception", e);
      this.buildErrorResponse(e.getMessage(), 500, responseJson);
    }

    try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, "UTF-8")) {
      writer.write(responseJson.toString());
      writer.close();
    } catch (Exception e) {
      throw e;
    }

  }

  @SuppressWarnings("unchecked")
  private void buildSuccessfulResponse(String encodedReport, JSONObject responseJson) {
    JSONObject headerJson = new JSONObject();
    headerJson.put("Content-Type", "application/pdf");
    headerJson.put("Accept", "application/pdf");
    headerJson.put("Content-disposition", "attachment; filename=file.pdf");
    responseJson.put("body", encodedReport);
    responseJson.put("statusCode", 200);
    responseJson.put("isBase64Encoded", true);
    responseJson.put("headers", headerJson);
  }

  @SuppressWarnings("unchecked")
  private void buildErrorResponse(String message, int statusCode, JSONObject responseJson) {
    JSONObject headerJson = new JSONObject();
    headerJson.put("Content-Type", "application/json");

    JSONObject body = new JSONObject();
    body.put("message", message);
    responseJson.put("body", body.toJSONString());
    responseJson.put("statusCode", statusCode);
    responseJson.put("headers", headerJson);
  }

}
