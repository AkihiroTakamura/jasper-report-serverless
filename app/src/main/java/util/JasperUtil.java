package util;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.util.Base64;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;

public class JasperUtil {

  static Logger logger = Logger.getLogger(JasperUtil.class.getName());

  public String generateBase64Report(
      String templatePath, Map<String, Object> parameters, List<Map<String, Object>> data)
      throws JRException, IOException, BadRequestException {

    try (InputStream templateStream = getTemplateFromS3(templatePath)) {

      JasperReport jasperReport = JasperCompileManager.compileReport(templateStream);

      JasperPrint jasperPrint = JasperFillManager
          .fillReport(
              jasperReport,
              parameters,
              new JRBeanCollectionDataSource(data));

      byte[] output = JasperExportManager.exportReportToPdf(jasperPrint);

      return new String(Base64.encode(output), StandardCharsets.US_ASCII);
    } catch (Exception e) {
      logger.log(Level.WARNING, "jasper error", e);
      e.printStackTrace();
      throw e;
    }
  }

  private InputStream getTemplateFromS3(String templatePath) throws BadRequestException {
    String bucketName = System.getenv("TEMPLATE_BUCKET");
    String region = System.getenv("REGION");

    if (bucketName.isEmpty() || region.isEmpty())
      throw new BadRequestException("envitonment variables TEMPLATE_BUCKET and REGION is required");

    AmazonS3 s3 = AmazonS3ClientBuilder
        .standard()
        .withRegion(region)
        .build();

    S3Object object = s3.getObject(new GetObjectRequest(bucketName, templatePath));


    if (object == null)
      throw new BadRequestException("report template not found");

    return object.getObjectContent();

  }

}
