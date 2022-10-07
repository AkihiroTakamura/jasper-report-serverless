package util;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.List;
import java.util.Map;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import com.amazonaws.util.Base64;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dto.RequestBodyDto;

public class RequestUtil {

  public static RequestBodyDto extractRequestBody(InputStream inputStream, ObjectMapper mapper)
      throws ParseException, BadRequestException, IOException {
    JSONParser parser = new JSONParser();
    BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));

    JSONObject event = (JSONObject) parser.parse((Reader) reader);

    if (event.get("body") == null)
      throw new BadRequestException("required request body");

    // api-gatewayがbodyをBase64encodeしてるのでdecodeする
    String decoded = new String(Base64.decode(event.get("body").toString()), "UTF-8");

    Map<String, Object> body = mapper
        .readValue(decoded, new TypeReference<Map<String, Object>>() {});

    return RequestBodyDto.builder()
        .templatePath(body.get("templatePath").toString())
        .parameters(mapper.convertValue(
            body.get("parameters"),
            new TypeReference<Map<String, Object>>() {}))
        .data(
            mapper.convertValue(
                body.get("data"),
                new TypeReference<List<Map<String, Object>>>() {}))
        .build();
  }

}
