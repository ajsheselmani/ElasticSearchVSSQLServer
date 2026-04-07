import React from "react";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { LoadingScreen } from "src/components/loading-screen";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Iconify } from "src/components/iconify";
import Upsert from "src/pages/administration/authorisation/operation/upsert";

const query = gql`
  query modules($moduleId: Int!) {
    modules(where: { moduleId: { eq: $moduleId } }) {
      items {
        nameSq
        nameEn
        nameSr
        moduleId
        moduleOperation {
          moduleOperationId
          nameSq
          nameEn
          nameSr
          active
          insertedFrom
          insertedDate
        }
      }
    }
  }
`;

export default function Index() {
  const { id, operationId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [getItems, { loading, data }] = useLazyQuery(query);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    getItems({ variables: { moduleId: +id } });
  }, []);

  React.useEffect(() => {
    if (operationId) {
      setExpanded(operationId);
    }
  }, [operationId]);

  React.useEffect(() => {
    if (location.pathname == `/administration/authorisation/operation/${id}`) {
      getItems({ variables: { moduleId: +id } });
    }
  }, [location.pathname]);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
    if (isExpanded) navigate(panel.toString());
    else navigate(-1);
  };

  const userLanguage =
    i18n.language.charAt(0).toUpperCase() + i18n.language.slice(1);

  return (
    <>
      <Box className="m-2">
        {loading && <LoadingScreen />}
        <Card>
          <CardContent>
            <div className="flex justify-between">
              <h4>
                {t("moduleoperationList")}:
                <b>{data?.modules?.items[0][`name${userLanguage}`]}</b>
              </h4>
              <Button
                variant="contained"
                startIcon={<Icon icon="ic:baseline-plus" />}
                onClick={() => navigate(`create`)}
              >
                {t("addModuleOperation")}
              </Button>
            </div>
            <div>
              {data?.modules?.items[0].moduleOperation.map(
                (operation, index) => (
                  <Accordion
                    className="w-full"
                    expanded={expanded == operation.moduleOperationId}
                    onChange={handleChange(operation.moduleOperationId)}
                    id={operation.moduleOperationId}
                  >
                    <AccordionSummary
                      expandIcon={<Icon icon="ooui:expand" />}
                      aria-controls="panel1bh-content"
                      id="panel1bh-header"
                    >
                      <Typography component="span">
                        {index + 1}. {operation[`name${userLanguage}`]}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="flex justify-between mb-1">
                        <p className="flex items-center gap-1">
                          <Iconify icon="dashicons:shield" />{" "}
                          {t("assignAccessIntoModule")}
                        </p>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            navigate(`edit/${operation.moduleOperationId}`)
                          }
                          startIcon={<Icon icon="ic:baseline-edit" />}
                        >
                          {t("editmoduleOperation")}
                        </Button>
                      </div>
                      <Outlet />
                      <br />
                      {/* <div className="mt-2">
                      <RoleAccess />
                    </div> */}
                      {/* <br />
                    <UserAccess /> */}
                    </AccordionDetails>
                  </Accordion>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </Box>
      {location.pathname.endsWith("/create") && <Upsert />}
    </>
  );
}
