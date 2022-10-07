package dto;

import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * @return
 */
@Getter
@Setter
@Builder
public class RequestBodyDto {
  private final String templatePath;

  private final Map<String, Object> parameters;

  private final List<Map<String, Object>> data;

}
